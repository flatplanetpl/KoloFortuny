const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const root = path.resolve(__dirname, '..');
const assets = fs.existsSync(path.join(root, 'dist/app.js')) ? path.join(root, 'dist') : root;
const read = (file) => fs.readFileSync(path.join(assets, file), 'utf8');
const mod = (x) => ((x % 360) + 360) % 360;
const windowData = {};
vm.runInNewContext(read('motion.js'), { window: windowData });
vm.runInNewContext(read('i18n.js'), { window: windowData });

test('manual stop is continuous, never reverses and preserves the selected field', () => {
  for (const from of [0, 117, 359]) for (const finish of [0, 27.69, 180, 359]) {
    for (const duration of [6500, 8599]) for (const at of [0, 1, 100, 900, 1800, 3500, 5000, 6400, 8500]) {
      const to = from + 7 * 360 + mod(finish - from);
      const motion = windowData.WheelMotion.createMotion(from, to, duration);
      const before = motion.sample(at);
      motion.stop(at);
      const after = motion.sample(at);
      assert.ok(Math.abs(before.angle - after.angle) < 1e-7);
      assert.ok(Math.abs(before.velocity - after.velocity) < 1e-7);
      motion.stop(at + 10);
      let last = after.angle;
      for (let time = at; time < at + 1810; time += 10) {
        const sample = motion.sample(time);
        assert.ok(sample.angle >= last - 1e-7);
        last = sample.angle;
      }
      const result = motion.sample(at + 1810);
      assert.equal(result.done, true);
      assert.ok(Math.abs(mod(result.angle - to + 180) - 180) < 1e-7);
      assert.ok(Math.abs(result.velocity) < 1e-7);
    }
  }
});

test('all seven languages cover every interface and prize key, with local flags', () => {
  const { messages, languages } = windowData.WheelI18n;
  assert.equal(languages.length, 7);
  for (const { code, flag } of languages) {
    assert.deepEqual(Object.keys(messages[code]).sort(), Object.keys(messages.pl).sort());
    assert.deepEqual(Object.keys(messages[code].prizes).sort(), Object.keys(messages.pl.prizes).sort());
    assert.ok(fs.existsSync(path.join(assets, `flags/${flag}.svg`)));
    for (const match of read('index.html').matchAll(/data-i18n(?:-aria)?="([^"]+)"/g)) {
      assert.equal(typeof messages[code][match[1]], 'string');
    }
  }
  assert.ok(fs.existsSync(path.join(assets, 'logo-lobster.jpg')));
  assert.ok(fs.existsSync(path.join(assets, 'google-review-qr.svg')));
  assert.match(read('index.html'), /search\.google\.com\/local\/writereview\?placeid=ChIJ-Qe7Cz7DD0cRHjLYqvnk1YM/);
  assert.match(read('google-review-qr.svg'), /ChIJ-Qe7Cz7DD0cRHjLYqvnk1YM/);
});

// Minimal event/element fixture: exercises the actual app with a deterministic clock.
class Element {
  constructor(tag = 'div') {
    this.tag = tag; this.children = []; this.style = {}; this.dataset = {};
    this.attributes = {}; this.events = {}; this.classList = { toggle() {} };
    this.open = false; this.disabled = false; this.showCount = 0;
  }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  append(...items) { this.children.push(...items.flatMap((n) => n.tag === 'fragment' ? n.children : [n])); }
  replaceChildren(...items) { this.children = []; this.append(...items); }
  querySelectorAll(tag) { return this.children.flatMap((child) => [...(child.tag === tag ? [child] : []), ...child.querySelectorAll(tag)]); }
  addEventListener(type, handler) { (this.events[type] ||= []).push(handler); }
  dispatch(type, event = {}) { return (this.events[type] || []).map((f) => f({ target: this, ...event })); }
  focus() {}
  contains(target) { return target === this || this.children.some((c) => c.contains(target)); }
  closest() { return null; }
  animate() { return {}; }
  showModal() { this.open = true; this.showCount++; }
  close() { this.open = false; }
  getContext() { return new Proxy({}, { get: () => () => {} }); }
}

function appFixture({ reduced = false, language = 'pl', ticket = 0, oldHistory = [] } = {}) {
  let time = 0, nextFrame = 0;
  const frames = new Map(), nodes = new Map();
  const node = (selector) => { if (!nodes.has(selector)) nodes.set(selector, new Element()); return nodes.get(selector); };
  const document = new Element('document');
  const translations = [...read('index.html').matchAll(/data-i18n(-aria)?="([^"]+)"/g)].map((match) => {
    const el = new Element(); el.dataset[match[1] ? 'i18nAria' : 'i18n'] = match[2]; return el;
  });
  Object.assign(document, {
    documentElement: new Element('html'), querySelector: node,
    querySelectorAll: (selector) => translations.filter((el) => selector === '[data-i18n]' ? el.dataset.i18n : el.dataset.i18nAria),
    createElement: (tag) => new Element(tag), createElementNS: (_, tag) => new Element(tag),
    createDocumentFragment: () => new Element('fragment')
  });
  const local = new Map([['wheel-language', language], ['wheel-history', JSON.stringify(oldHistory)], ['wheel-sound', 'off']]);
  const session = new Map();
  const storage = (map) => ({ getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)) });
  const rng = [ticket, 2147483648, 0, 0];
  const context = vm.createContext({
    window: { ...windowData, matchMedia: () => ({ matches: reduced }), localStorage: storage(local), sessionStorage: storage(session) },
    document, navigator: {}, performance: { now: () => time }, innerWidth: 360, innerHeight: 800,
    crypto: { getRandomValues: (values) => { values[0] = rng.length ? rng.shift() : 0; return values; } },
    requestAnimationFrame: (f) => { frames.set(++nextFrame, f); return nextFrame; }, cancelAnimationFrame: (id) => frames.delete(id)
  });
  vm.runInContext(read('app.js'), context);
  return { node, document, local, session,
    language: (code) => node('#languageOptions').children.find((b) => b.dataset.language === code).dispatch('click'),
    advance: async (until) => {
      while (time < until) {
        time = Math.min(until, time + 16);
        const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((f) => f(time));
        await Promise.resolve();
      }
    }
  };
}

test('switching language during a stopped spin yields one translated result and stable geometry', async () => {
  for (const ticket of [0, 35, 39, 74, 80, 86, 95, 99, 108, 120, 155, 190, 196]) {
    const app = appFixture({ ticket });
    assert.equal(app.node('#wheelPrizeList').children.length, 13);
    app.node('#spinButton').dispatch('click');
    await app.advance(900);
    const angle = app.node('#wheel').style.transform;
    app.language('ja');
    assert.equal(app.node('#wheel').style.transform, angle);
    assert.equal(app.document.documentElement.lang, 'ja');
    app.node('#stopButton').dispatch('click');
    app.node('#stopButton').dispatch('click');
    assert.equal(app.node('#stopButton').disabled, true);
    await app.advance(2800);
    assert.equal(app.node('#resultDialog').showCount, 1);
    const records = JSON.parse(app.local.get('wheel-history'));
    assert.equal(records.length, 1);
    const expected = windowData.WheelI18n.messages.ja.prizes[records[0].id][0];
    assert.equal(app.node('#resultPrize').textContent, expected);
    assert.equal(app.node('#historyList').children[0].children[1].textContent, expected);
    assert.equal(app.node('#spinButton').disabled, false);
    app.language('uk');
    assert.equal(app.node('#resultPrize').textContent, windowData.WheelI18n.messages.uk.prizes[records[0].id][0]);
    assert.equal(app.local.get('wheel-language'), 'uk');
    const chance = appFixture({ ticket, reduced: true });
    await Promise.all(chance.node('#spinButton').dispatch('click'));
    const a = Number(app.session.get('wheel-rotation')), b = Number(chance.session.get('wheel-rotation'));
    assert.ok(Math.abs(mod(a - b + 180) - 180) < 1e-6);
  }
});

test('existing Polish history translates and unsupported saved language falls back to Polish', () => {
  for (const { code } of windowData.WheelI18n.languages) {
    const app = appFixture({ language: code, oldHistory: [{ name: 'Piwo bezalkoholowe', icon: '🍺', iso: '2026-09-05T12:00:00Z' }] });
    assert.equal(app.document.documentElement.lang, code);
    assert.equal(app.node('#historyList').children[0].children[1].textContent, windowData.WheelI18n.messages[code].prizes.alcoholFree[0]);
  }
  assert.equal(appFixture({ language: 'unknown' }).document.documentElement.lang, 'pl');
});

test('Space starts and stops the spin, idle stop is harmless, normal completion still works', async () => {
  const app = appFixture();
  app.node('#stopButton').dispatch('click');
  assert.equal(app.node('#resultDialog').showCount, 0);
  const key = { code: 'Space', preventDefault() {} };
  app.document.dispatch('keydown', key);
  await app.advance(1500);
  app.document.dispatch('keydown', key);
  await app.advance(3100);
  assert.equal(app.node('#resultDialog').showCount, 1);
  const normal = appFixture();
  normal.node('#spinButton').dispatch('click');
  await normal.advance(6600);
  assert.equal(normal.node('#resultDialog').showCount, 1);
});
