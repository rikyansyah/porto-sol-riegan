// Audio Porto Sol: semua suara disintesis WebAudio, tanpa file audio.
// Mesin (osilator sawtooth mengikuti kecepatan), sirene polisi (dua nada),
// tembakan (noise burst), pickup (dering naik), dan klakson.
export function createAudio() {
  let ctx = null, engineOsc = null, engineGain = null, sirenTimer = 0;
  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      engineOsc = ctx.createOscillator(); engineOsc.type = 'sawtooth'; engineOsc.frequency.value = 60;
      engineGain = ctx.createGain(); engineGain.gain.value = 0;
      engineOsc.connect(engineGain); engineGain.connect(ctx.destination);
      engineOsc.start();
      return true;
    } catch { return false; }
  }
  function blip(freq, dur, type, vol, slideTo) {
    if (!ensure()) return;
    try {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type || 'sine'; o.frequency.value = freq;
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
      g.gain.value = vol || 0.15;
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(); o.stop(ctx.currentTime + dur);
    } catch { /* suara opsional */ }
  }
  return {
    unlock() { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); },
    engine(speed, inCar) {
      if (!ensure() || !engineGain) return;
      engineGain.gain.value = inCar ? 0.03 + Math.min(0.06, Math.abs(speed) / 6000) : 0;
      engineOsc.frequency.value = 55 + Math.abs(speed) / 6;
    },
    siren(dt, wanted) {
      if (!ensure() || wanted === 0) return;
      sirenTimer -= dt;
      // Dua nada naik-turun khas sirene, dipicu berkala selama wanted > 0.
      if (sirenTimer <= 0) { sirenTimer = 0.55; blip(720, 0.5, 'sine', 0.05, 980); }
    },
    shot() { blip(160, 0.12, 'square', 0.2, 60); },
    pickup() { blip(660, 0.12, 'sine', 0.15, 990); },
    mission() { blip(523, 0.15, 'sine', 0.18); setTimeout(() => blip(784, 0.25, 'sine', 0.18), 140); },
    crash() { blip(90, 0.25, 'sawtooth', 0.2, 40); },
  };
}
