(() => {
  'use strict';

  const { languages, messages } = window.WheelI18n;

  const prizes = [
    { id: 'consolation', name: 'Nagroda pocieszenia', icon: '★', weight: 35 },
    { id: 'drink', name: 'Dowolny drink alk/bezalk', icon: '🍹', weight: 4 },
    { id: 'consolation', name: 'Nagroda pocieszenia', icon: '★', weight: 35 },
    { id: 'wheat03', name: 'Pszenica 0,3', icon: '🍺', weight: 6 },
    { id: 'alcoholFree', name: 'Piwo bezalkoholowe', icon: '🍺', weight: 6 },
    { id: 'cucumber', name: 'Lemoniada ogórkowa', icon: '🥒', weight: 9 },
    { id: 'wheat05', name: 'Pszenica 0,5', icon: '🍺', weight: 4 },
    { id: 'lemon', name: 'Lemoniada cytrynowa', icon: '🍋', weight: 9 },
    { id: 'chips', name: 'Chipsy', icon: '🥔', weight: 12 },
    { id: 'consolation', name: 'Nagroda pocieszenia', icon: '★', weight: 35 },
    { id: 'consolation', name: 'Nagroda pocieszenia', icon: '★', weight: 35 },
    { id: 'pils03', name: 'Pils 0,3', icon: '🍺', weight: 6 },
    { id: 'pils05', name: 'Pils 0,5', icon: '🍺', weight: 4 }
  ];

  const segmentAngle = 360 / prizes.length;
  const totalPrizeWeight = prizes.reduce((sum, prize) => sum + prize.weight, 0);
  const pointerAngle = -90;
  const firstSectorCenter = -90;
  const sectorColors = [
    '#f18772', '#70a49b', '#f5bd58', '#fff3df', '#a9c7ae',
    '#f18772', '#70a49b', '#f5bd58', '#fff3df', '#a9c7ae',
    '#f18772', '#70a49b', '#f5bd58'
  ];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wheel = document.querySelector('#wheel');
  const wheelSvg = document.querySelector('#wheelSvg');
  const wheelStage = document.querySelector('#wheelStage');
  const wheelPrizeList = document.querySelector('#wheelPrizeList');
  const pointer = document.querySelector('.wheel-pointer');
  const spinButton = document.querySelector('#spinButton');
  const spinAgainButton = document.querySelector('#spinAgainButton');
  const spinLabel = document.querySelector('#spinLabel');
  const stopButton = document.querySelector('#stopButton');
  const stopLabel = document.querySelector('#stopLabel');
  const languagePicker = document.querySelector('#languagePicker');
  const languageToggle = document.querySelector('#languageToggle');
  const languageOptions = document.querySelector('#languageOptions');
  const languageFlag = document.querySelector('#languageFlag');
  const languageName = document.querySelector('#languageName');
  const statusTitle = document.querySelector('#statusTitle');
  const statusCopy = document.querySelector('#statusCopy');
  const statusDot = document.querySelector('#statusDot');
  const historyList = document.querySelector('#historyList');
  const clearHistoryButton = document.querySelector('#clearHistoryButton');
  const soundButton = document.querySelector('#soundButton');
  const fullscreenButton = document.querySelector('#fullscreenButton');
  const resultDialog = document.querySelector('#resultDialog');
  const closeDialogButton = document.querySelector('#closeDialogButton');
  const resultPrize = document.querySelector('#resultPrize');
  const resultIcon = document.querySelector('#resultIcon');
  const announcer = document.querySelector('#announcer');
  const confettiCanvas = document.querySelector('#confetti');
  const ctx = confettiCanvas.getContext('2d');
  const localStore = storageArea('localStorage');
  const sessionStore = storageArea('sessionStorage');

  let currentLanguage = storageGet(localStore, 'wheel-language') || 'pl';
  if (!languages.some((language) => language.code === currentLanguage)) currentLanguage = 'pl';
  let rotation = normalize(Number(storageGet(sessionStore, 'wheel-rotation')) || 0);
  let visualRotation = rotation;
  let spinning = false;
  let stopRequested = false;
  let stopAnimation = null;
  let lastWinner = null;
  let statusMode = 'ready';
  let soundEnabled = storageGet(localStore, 'wheel-sound') !== 'off';
  let audioContext = null;
  let tickFrame = 0;
  let confettiFrame = 0;
  let history = readHistory();
  const uprightWheelContent = [];

  renderLanguageOptions();
  applyLanguage(currentLanguage);

  function t(key) {
    return messages[currentLanguage][key] ?? messages.pl[key];
  }

  function locale() {
    return languages.find((language) => language.code === currentLanguage).locale;
  }

  function localizedPrize(prize) {
    const [name, lines] = t('prizes')[prize.id];
    return { ...prize, name, lines };
  }

  function renderLanguageOptions() {
    const fragment = document.createDocumentFragment();
    languages.forEach((language) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.language = language.code;
      const flag = document.createElement('img');
      flag.src = `./flags/${language.flag}.svg`;
      flag.alt = '';
      flag.width = 24;
      flag.height = 18;
      const name = document.createElement('span');
      name.lang = language.code;
      name.textContent = language.name;
      const check = document.createElement('span');
      check.className = 'language-check';
      check.setAttribute('aria-hidden', 'true');
      check.textContent = '✓';
      button.append(flag, name, check);
      button.addEventListener('click', () => {
        applyLanguage(language.code);
        storageSet(localStore, 'wheel-language', language.code);
        languagePicker.open = false;
        languageToggle.focus();
      });
      fragment.append(button);
    });
    languageOptions.replaceChildren(fragment);
  }

  function applyLanguage(code) {
    if (!languages.some((language) => language.code === code)) return;
    currentLanguage = code;
    document.documentElement.lang = code;
    document.title = t('title');
    document.querySelector('meta[name="description"]').setAttribute('content', t('description'));
    document.querySelectorAll('[data-i18n]').forEach((element) => {
      element.textContent = t(element.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach((element) => {
      element.setAttribute('aria-label', t(element.dataset.i18nAria));
    });
    const language = languages.find((item) => item.code === code);
    languageFlag.src = `./flags/${language.flag}.svg`;
    languageName.textContent = language.name;
    languageName.lang = code;
    languageOptions.querySelectorAll('button').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.language === code));
    });
    buildWheel();
    renderPrizeList();
    renderWheel(visualRotation);
    renderHistory();
    updateStatus();
    updateSoundButton();
    updateFullscreenButton();
    if (lastWinner) resultPrize.textContent = localizedPrize(lastWinner).name;
  }

  function updateStatus() {
    spinLabel.textContent = spinning ? t('spinning') : t('spin');
    stopLabel.textContent = stopRequested ? t('stopping') : t('stop');
    const mode = spinning ? (stopRequested ? 'stopping' : 'spinning') : statusMode;
    statusTitle.textContent = mode === 'result' ? t('winnerTitle') : t(`${mode}Title`);
    statusCopy.textContent = mode === 'result' && lastWinner ? localizedPrize(lastWinner).name : t(`${mode}Copy`);
  }

  function renderWheel(angle) {
    visualRotation = angle;
    wheel.style.transform = `rotate(${angle}deg)`;
    updateUprightWheelContent(angle);
  }

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  }

  function pointOnCircle(radius, angle) {
    const radians = angle * Math.PI / 180;
    return {
      x: 500 + radius * Math.cos(radians),
      y: 500 + radius * Math.sin(radians)
    };
  }

  function sectorCenter(index) {
    return firstSectorCenter + index * segmentAngle;
  }

  function buildWheel() {
    const radius = 430;
    const fragment = document.createDocumentFragment();
    uprightWheelContent.length = 0;
    fragment.append(svgElement('circle', { cx: 500, cy: 500, r: 488, fill: '#a83e19' }));

    prizes.forEach((prize, index) => {
      const center = sectorCenter(index);
      const start = pointOnCircle(radius, center - segmentAngle / 2);
      const end = pointOnCircle(radius, center + segmentAngle / 2);
      fragment.append(svgElement('path', {
        d: `M 500 500 L ${start.x.toFixed(4)} ${start.y.toFixed(4)} A ${radius} ${radius} 0 0 1 ${end.x.toFixed(4)} ${end.y.toFixed(4)} Z`,
        fill: sectorColors[index],
        class: 'wheel-segment'
      }));
    });

    const separators = svgElement('g', {
      stroke: '#fdf6eb',
      'stroke-width': 4,
      'stroke-linecap': 'round'
    });
    prizes.forEach((_, index) => {
      const edge = pointOnCircle(radius, sectorCenter(index) - segmentAngle / 2);
      separators.append(svgElement('line', {
        x1: 500,
        y1: 500,
        x2: edge.x.toFixed(4),
        y2: edge.y.toFixed(4)
      }));
    });
    fragment.append(separators);

    fragment.append(svgElement('circle', {
      cx: 500,
      cy: 500,
      r: 459,
      fill: 'none',
      stroke: '#db5b28',
      'stroke-width': 58
    }));
    fragment.append(svgElement('circle', {
      cx: 500,
      cy: 500,
      r: 429,
      fill: 'none',
      stroke: '#a83e19',
      'stroke-width': 7
    }));

    const dots = svgElement('g', { fill: '#fff3df' });
    for (let index = 0; index < 26; index += 1) {
      const dot = pointOnCircle(458, -90 + index * 360 / 26);
      dots.append(svgElement('circle', {
        cx: dot.x.toFixed(3),
        cy: dot.y.toFixed(3),
        r: 6.2
      }));
    }
    fragment.append(dots);

    prizes.forEach((definition, index) => {
      const angle = sectorCenter(index);
      const prize = localizedPrize(definition);
      const iconPoint = pointOnCircle(216, angle);
      const labelPoint = pointOnCircle(326, angle);

      const icon = svgElement('text', {
        x: iconPoint.x.toFixed(3),
        y: iconPoint.y.toFixed(3),
        class: 'wheel-icon',
        'font-size': 44,
        'text-anchor': 'middle',
        'dominant-baseline': 'central'
      });
      icon.textContent = prize.icon;
      uprightWheelContent.push({ element: icon, point: iconPoint });
      fragment.append(icon);

      const longestLine = Math.max(...prize.lines.map((line) => [...line].reduce(
        (width, character) => width + (/[\u2e80-\u9fff\uac00-\ud7af\uff00-\uffef]/u.test(character) ? 1 : .62), 0
      )));
      const fontSize = Math.max(16, Math.min(24, Math.floor(138 / longestLine)));
      const lineHeight = fontSize * 1.08;
      const text = svgElement('text', {
        x: labelPoint.x.toFixed(3),
        y: labelPoint.y.toFixed(3),
        class: 'wheel-label',
        'font-size': fontSize,
        'text-anchor': 'middle'
      });

      prize.lines.forEach((line, lineIndex) => {
        const tspan = svgElement('tspan', {
          x: labelPoint.x.toFixed(3),
          dy: lineIndex === 0 ? -((prize.lines.length - 1) * lineHeight / 2) : lineHeight
        });
        tspan.textContent = line;
        text.append(tspan);
      });
      uprightWheelContent.push({ element: text, point: labelPoint });
      fragment.append(text);
    });

    fragment.append(svgElement('circle', {
      cx: 500,
      cy: 500,
      r: 92,
      fill: '#fff8ec',
      stroke: '#a83e19',
      'stroke-width': 16
    }));
    fragment.append(svgElement('circle', {
      cx: 500,
      cy: 500,
      r: 34,
      fill: '#db5b28',
      stroke: '#f18772',
      'stroke-width': 5
    }));

    wheelSvg.replaceChildren(fragment);
  }

  function updateUprightWheelContent(wheelRotation) {
    const counterRotation = -normalize(wheelRotation);
    uprightWheelContent.forEach(({ element, point }) => {
      element.setAttribute(
        'transform',
        `rotate(${counterRotation.toFixed(3)} ${point.x.toFixed(3)} ${point.y.toFixed(3)})`
      );
    });
  }

  function renderPrizeList() {
    const fragment = document.createDocumentFragment();
    prizes.forEach((prize) => {
      const item = document.createElement('li');
      const name = document.createElement('span');
      name.className = 'prize-key-name';
      name.textContent = localizedPrize(prize).name;

      const chance = document.createElement('span');
      chance.className = 'prize-key-chance';
      chance.textContent = formatChance(prize.weight);

      item.append(name, chance);
      fragment.append(item);
    });
    wheelPrizeList.replaceChildren(fragment);
  }

  function secureRandom() {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return values[0] / 4294967296;
  }

  function randomInt(max) {
    const range = 4294967296;
    const limit = Math.floor(range / max) * max;
    const values = new Uint32Array(1);
    do {
      crypto.getRandomValues(values);
    } while (values[0] >= limit);
    return values[0] % max;
  }

  function weightedPrizeIndex() {
    const ticket = randomInt(totalPrizeWeight);
    let cumulativeWeight = 0;

    for (let index = 0; index < prizes.length; index += 1) {
      cumulativeWeight += prizes[index].weight;
      if (ticket < cumulativeWeight) return index;
    }

    return prizes.length - 1;
  }

  function formatChance(weight) {
    return (weight / totalPrizeWeight).toLocaleString(locale(), {
      style: 'percent', maximumFractionDigits: 2
    });
  }

  function storageArea(name) {
    try {
      return window[name];
    } catch {
      return null;
    }
  }

  function storageGet(storage, key) {
    if (!storage) return null;
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  function storageSet(storage, key, value) {
    if (!storage) return;
    try {
      storage.setItem(key, value);
    } catch {
      // Storage is optional; the current game keeps working without it.
    }
  }

  function readHistory() {
    try {
      const stored = JSON.parse(storageGet(localStore, 'wheel-history') || '[]');
      if (!Array.isArray(stored)) return [];
      return stored.filter((entry) => entry && typeof entry === 'object').slice(0, 8).map((entry) => {
        const prize = prizes.find((item) => item.id === entry.id || item.name === entry.name);
        return prize ? { ...entry, id: prize.id, icon: prize.icon } : entry;
      });
    } catch {
      return [];
    }
  }

  function saveHistory() {
    storageSet(localStore, 'wheel-history', JSON.stringify(history));
  }

  function renderHistory() {
    historyList.replaceChildren();
    clearHistoryButton.hidden = history.length === 0;

    if (!history.length) {
      const empty = document.createElement('li');
      empty.className = 'empty-history';
      empty.textContent = t('emptyHistory');
      historyList.append(empty);
      return;
    }

    history.forEach((entry) => {
      const item = document.createElement('li');
      item.className = 'history-item';

      const emoji = document.createElement('span');
      emoji.className = 'history-emoji';
      emoji.textContent = entry.icon;
      emoji.setAttribute('aria-hidden', 'true');

      const name = document.createElement('span');
      name.className = 'history-name';
      const prize = prizes.find((item) => item.id === entry.id);
      name.textContent = prize ? localizedPrize(prize).name : entry.name;

      const time = document.createElement('time');
      time.className = 'history-time';
      time.dateTime = entry.iso;
      const date = new Date(entry.iso);
      time.textContent = Number.isNaN(date.getTime()) ? (entry.time || '')
        : date.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' });

      item.append(emoji, name, time);
      historyList.append(item);
    });
  }

  function addHistory(prize) {
    const now = new Date();
    history.unshift({
      id: prize.id,
      name: prize.name,
      icon: prize.icon,
      iso: now.toISOString(),
      time: now.toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit' })
    });
    history = history.slice(0, 8);
    saveHistory();
    renderHistory();
  }

  function ensureAudio() {
    if (!soundEnabled) return null;
    if (!audioContext) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtor) return null;
      audioContext = new AudioCtor();
    }
    if (audioContext.state === 'suspended') audioContext.resume();
    return audioContext;
  }

  function tone(frequency, duration, gainValue = .035, delay = 0) {
    const audio = ensureAudio();
    if (!audio) return;
    const start = audio.currentTime + delay;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(gainValue, start);
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  function playTick(speed) {
    tone(Math.min(1120, 510 + speed * 6), .035, .024);
    if (!reducedMotion.matches) {
      pointer.animate(
        [
          { transform: 'translateX(-50%) rotate(0deg)', offset: 0 },
          { transform: 'translateX(-50%) rotate(-3.5deg)', offset: .45 },
          { transform: 'translateX(-50%) rotate(1.1deg)', offset: .75 },
          { transform: 'translateX(-50%) rotate(0deg)', offset: 1 }
        ],
        { duration: Math.max(48, Math.min(120, 130 - speed)), easing: 'ease-out' }
      );
    }
  }

  function playWin() {
    tone(523.25, .34, .045, 0);
    tone(659.25, .38, .042, .11);
    tone(783.99, .48, .04, .22);
  }

  function modulo(value, base) {
    return ((value % base) + base) % base;
  }

  function animateWheel(startRotation, target, duration) {
    // One clock updates the disc and upright content in the same paint.
    if (reducedMotion.matches) {
      renderWheel(target);
      return Promise.resolve(target);
    }
    return new Promise((resolve, reject) => {
      const motion = window.WheelMotion.createMotion(startRotation, target, duration);
      const startTime = performance.now();
      stopAnimation = () => motion.stop(performance.now() - startTime);
      let previousTime = startTime;
      let previousAngle = startRotation;
      const phase = modulo(
        pointerAngle - (firstSectorCenter - segmentAngle / 2), segmentAngle
      );
      let nextBoundary = startRotation + modulo(phase - startRotation, segmentAngle);
      if (nextBoundary <= startRotation + .001) nextBoundary += segmentAngle;

      const frame = (now) => {
        try {
          const sample = motion.sample(now - startTime);
          const angle = sample.angle;
          renderWheel(angle);
          if (angle >= nextBoundary) {
            playTick((angle - previousAngle) / Math.max(1, now - previousTime) * 1000);
            nextBoundary += (Math.floor((angle - nextBoundary) / segmentAngle) + 1) * segmentAngle;
          }
          previousAngle = angle;
          previousTime = now;
          if (!sample.done) tickFrame = requestAnimationFrame(frame);
          else { stopAnimation = null; resolve(angle); }
        } catch (error) {
          stopAnimation = null;
          reject(error);
        }
      };
      tickFrame = requestAnimationFrame(frame);
    });
  }

  function setBusy(value) {
    spinning = value;
    spinButton.disabled = value;
    spinAgainButton.disabled = value;
    stopButton.disabled = !value || stopRequested || reducedMotion.matches;
    wheelStage.classList.toggle('is-spinning', value);
    statusDot.classList.toggle('is-busy', value);
    updateStatus();
  }

  function stopSpin() {
    if (!spinning || stopRequested || !stopAnimation) return;
    stopRequested = true;
    stopAnimation();
    stopButton.disabled = true;
    updateStatus();
  }

  function normalize(value) {
    return ((value % 360) + 360) % 360;
  }

  async function spin() {
    if (spinning) return;
    if (resultDialog.open) resultDialog.close();
    stopRequested = false;
    setBusy(true);

    try {
      ensureAudio();
      const winnerIndex = weightedPrizeIndex();
      const winner = prizes[winnerIndex];
      const safeJitter = (secureRandom() - .5) * segmentAngle * .56;
      const desiredModulo = normalize(pointerAngle - sectorCenter(winnerIndex) + safeJitter);
      const currentModulo = normalize(rotation);
      const correction = normalize(desiredModulo - currentModulo);
      const fullTurns = reducedMotion.matches ? 0 : 7 + randomInt(4);
      const target = rotation + fullTurns * 360 + correction;
      const duration = reducedMotion.matches ? 1 : 6500 + randomInt(2100);

      const finalAngle = await animateWheel(rotation, target, duration);

      rotation = normalize(finalAngle);
      renderWheel(rotation);
      storageSet(sessionStore, 'wheel-rotation', String(rotation));

      lastWinner = winner;
      statusMode = 'result';
      announcer.textContent = t('resultAnnouncement').replace('{prize}', localizedPrize(winner).name);
      addHistory(winner);
      showResult(winner);
    } catch {
      cancelAnimationFrame(tickFrame);
      rotation = normalize(visualRotation);
      renderWheel(rotation);
      statusMode = 'error';
    } finally {
      stopAnimation = null;
      stopRequested = false;
      setBusy(false);
    }
  }

  function showResult(prize) {
    resultPrize.textContent = localizedPrize(prize).name;
    resultIcon.textContent = prize.icon;
    playWin();
    if (navigator.vibrate) navigator.vibrate([45, 35, 90]);
    resultDialog.showModal();
    if (!reducedMotion.matches) launchConfetti();
  }

  function launchConfetti() {
    cancelAnimationFrame(confettiFrame);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    confettiCanvas.width = Math.floor(innerWidth * dpr);
    confettiCanvas.height = Math.floor(innerHeight * dpr);
    confettiCanvas.style.width = `${innerWidth}px`;
    confettiCanvas.style.height = `${innerHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const colors = ['#db5b28', '#f18772', '#70a49b', '#f5bd58', '#a9c7ae', '#fff3df'];
    const pieces = Array.from({ length: Math.min(150, Math.floor(innerWidth / 5)) }, () => ({
      x: innerWidth * (.15 + secureRandom() * .7),
      y: -20 - secureRandom() * innerHeight * .25,
      vx: (secureRandom() - .5) * 5.5,
      vy: 2.8 + secureRandom() * 5.2,
      gravity: .05 + secureRandom() * .07,
      drag: .989,
      rotation: secureRandom() * Math.PI,
      spin: (secureRandom() - .5) * .24,
      size: 5 + secureRandom() * 8,
      color: colors[randomInt(colors.length)],
      shape: secureRandom() > .35 ? 'rect' : 'circle'
    }));

    const start = performance.now();
    const draw = (now) => {
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      pieces.forEach((piece) => {
        piece.vx *= piece.drag;
        piece.vy += piece.gravity;
        piece.x += piece.vx;
        piece.y += piece.vy;
        piece.rotation += piece.spin;
        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.rotation);
        ctx.fillStyle = piece.color;
        if (piece.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, piece.size * .42, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-piece.size / 2, -piece.size * .28, piece.size, piece.size * .56);
        }
        ctx.restore();
      });
      if (now - start < 3800 && pieces.some((piece) => piece.y < innerHeight + 30)) {
        confettiFrame = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, innerWidth, innerHeight);
      }
    };
    confettiFrame = requestAnimationFrame(draw);
  }

  function updateSoundButton() {
    soundButton.setAttribute('aria-pressed', String(soundEnabled));
    soundButton.setAttribute('aria-label', soundEnabled ? t('soundOff') : t('soundOn'));
  }

  function updateFullscreenButton() {
    const active = Boolean(document.fullscreenElement);
    fullscreenButton.setAttribute('aria-label', active ? t('fullscreenOff') : t('fullscreenOn'));
  }

  spinButton.addEventListener('click', spin);
  stopButton.addEventListener('click', stopSpin);
  document.addEventListener('click', (event) => {
    if (!languagePicker.contains(event.target)) languagePicker.open = false;
  });
  spinAgainButton.addEventListener('click', () => {
    resultDialog.close();
    spin();
  });
  closeDialogButton.addEventListener('click', () => resultDialog.close());
  resultDialog.addEventListener('click', (event) => {
    if (event.target === resultDialog) resultDialog.close();
  });

  clearHistoryButton.addEventListener('click', () => {
    history = [];
    saveHistory();
    renderHistory();
  });

  soundButton.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    storageSet(localStore, 'wheel-sound', soundEnabled ? 'on' : 'off');
    updateSoundButton();
    if (soundEnabled) tone(660, .09, .025);
  });

  fullscreenButton.addEventListener('click', async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      fullscreenButton.hidden = true;
    }
  });

  if (!document.fullscreenEnabled) fullscreenButton.hidden = true;
  document.addEventListener('fullscreenchange', updateFullscreenButton);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && languagePicker.open) {
      languagePicker.open = false;
      languageToggle.focus();
      return;
    }
    if (event.code !== 'Space' || event.repeat || resultDialog.open) return;
    if (event.target?.closest?.('a, button, summary, input, textarea, select, [contenteditable]')) return;
    event.preventDefault();
    if (spinning) stopSpin();
    else spin();
  });

})();
