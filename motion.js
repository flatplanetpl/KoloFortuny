(() => {
  'use strict';

  const modulo = (value, base) => ((value % base) + base) % base;
  const clamp = (value) => Math.min(1, Math.max(0, value));

  function createMotion(from, to, duration) {
    let brake = null;
    let stopRequested = false;

    function sample(elapsed) {
      if (brake) {
        const p = clamp((elapsed - brake.start) / brake.duration);
        // Hermite interpolation keeps the current velocity and ends at rest.
        const distance = brake.to - brake.from;
        const tangent = brake.velocity * brake.duration;
        const angle = brake.from + distance * (3 * p * p - 2 * p * p * p)
          + tangent * (p * p * p - 2 * p * p + p);
        const velocity = (distance * (6 * p - 6 * p * p)
          + tangent * (3 * p * p - 4 * p + 1)) / brake.duration;
        return { angle: p === 1 ? brake.to : angle, velocity, done: p === 1 };
      }
      const p = clamp(elapsed / duration);
      const eased = 1 - (1 - p) ** 4 * (1 + 4 * p);
      return {
        angle: p === 1 ? to : from + (to - from) * eased,
        velocity: (to - from) * 20 * p * (1 - p) ** 3 / duration,
        done: p === 1
      };
    }

    function stop(elapsed) {
      if (stopRequested) return;
      stopRequested = true;
      // If the natural stop is imminent, keep its existing gentle deceleration.
      if (duration - elapsed <= 1800) return;
      const current = sample(elapsed);
      const brakeDuration = 1400;
      const remainder = modulo(to - current.angle, 360);
      // End at the same prize. The slope bound prevents reverse motion.
      const minimumDistance = current.velocity * brakeDuration / 3;
      const turns = Math.max(0, Math.ceil((minimumDistance - remainder) / 360));
      brake = {
        start: elapsed, duration: brakeDuration, from: current.angle,
        to: current.angle + remainder + turns * 360, velocity: current.velocity
      };
    }

    return { sample, stop };
  }

  window.WheelMotion = { createMotion };
})();
