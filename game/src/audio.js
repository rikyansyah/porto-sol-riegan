// Tiny WebAudio synth. Everything is guarded: no context until the first
// user gesture, and every call is a no-op if audio is unavailable, so
// headless screenshot runs never crash here.
let ctx = null;
let sirenNodes = null;
export function initAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
}
function tone(freq, dur, type = 'square', vol = 0.08, slide = 0) {
  if (!ctx || ctx.state !== 'running') return;
  try {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), ctx.currentTime + dur);
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
  } catch { /* ignore */ }
}
function noise(dur, vol = 0.12) {
  if (!ctx || ctx.state !== 'running') return;
  try {
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(); s.buffer = buf;
    const g = ctx.createGain(); g.gain.value = vol;
    s.connect(g).connect(ctx.destination); s.start();
  } catch { /* ignore */ }
}
export const sfx = {
  shot() { noise(0.09, 0.18); tone(160, 0.08, 'square', 0.06, -90); },
  punch() { noise(0.06, 0.1); tone(90, 0.07, 'sine', 0.1, -40); },
  crash() { noise(0.25, 0.2); tone(70, 0.2, 'sawtooth', 0.08, -30); },
  pickup() { tone(660, 0.09, 'sine', 0.09); setTimeout(() => tone(990, 0.12, 'sine', 0.09), 70); },
  cash() { tone(880, 0.07, 'triangle', 0.1); setTimeout(() => tone(1320, 0.1, 'triangle', 0.1), 60); },
  mission() { tone(523, 0.12, 'triangle', 0.1); setTimeout(() => tone(784, 0.18, 'triangle', 0.1), 110); },
  fail() { tone(220, 0.3, 'sawtooth', 0.08, -110); },
  door() { tone(300, 0.06, 'square', 0.05, -120); },
  reload() { tone(440, 0.05, 'square', 0.05); setTimeout(() => tone(440, 0.05, 'square', 0.05), 90); },
};
export function setSiren(on) {
  if (!ctx || ctx.state !== 'running') return;
  try {
    if (on && !sirenNodes) {
      const o = ctx.createOscillator(); const g = ctx.createGain(); const lfo = ctx.createOscillator();
      const lg = ctx.createGain(); o.type = 'triangle'; o.frequency.value = 750;
      lfo.frequency.value = 0.7; lg.gain.value = 180; lfo.connect(lg).connect(o.frequency);
      g.gain.value = 0.025; o.connect(g).connect(ctx.destination); o.start(); lfo.start();
      sirenNodes = { o, lfo };
    } else if (!on && sirenNodes) { sirenNodes.o.stop(); sirenNodes.lfo.stop(); sirenNodes = null; }
  } catch { sirenNodes = null; }
}
