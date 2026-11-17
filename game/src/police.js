// Polisi Porto Sol: wanted bintang 1–5, mobil patroli mengejar pemain,
// menabrak mobil pemain, dan menangkap bila terlalu dekat saat jalan kaki.
// Wanted naik karena kejahatan, turun bila pemain lama tak terlihat.
import { POLICE } from './config.js';
import { dist } from './world.js';

const POLICE_COLORS = ['#1c2f6e', '#243a8a'];

export function raiseWanted(state, stars) {
  const before = state.wanted;
  state.wanted = Math.max(state.wanted, Math.min(5, stars));
  state.wantedHeat = 60;
  if (state.wanted > before) { state.message = `WANTED ★${state.wanted} — Polisi Porto Sol mengejarmu!`; state.messageTimer = 4; }
}

export function updatePolice(state, dt) {
  // Jumlah mobil polisi mengikuti bintang wanted.
  const want = POLICE.countFor[state.wanted] || 0;
  while (state.policeCars.length < want) {
    const a = Math.random() * Math.PI * 2;
    const d = 700 + Math.random() * 300;
    state.policeCars.push({
      x: Math.max(120, Math.min(3080, state.player.x + Math.cos(a) * d)),
      y: Math.max(120, Math.min(2280, state.player.y + Math.sin(a) * d)),
      angle: 0, speed: 0, color: POLICE_COLORS[state.policeCars.length % 2],
      police: true, ai: false, parked: false, siren: Math.random() * 10,
    });
  }
  while (state.policeCars.length > want) state.policeCars.pop();
  for (const cop of state.policeCars) {
    cop.siren += dt;
    const dx = state.player.x - cop.x, dy = state.player.y - cop.y;
    const d = Math.hypot(dx, dy) || 1;
    const target = Math.atan2(dy, dx);
    let diff = target - cop.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    cop.angle += Math.max(-2.8 * dt, Math.min(2.8 * dt, diff));
    const top = POLICE.maxSpeed * (0.85 + state.wanted * 0.06);
    cop.speed += (top - cop.speed) * Math.min(1, dt * 0.9);
    cop.x += Math.cos(cop.angle) * cop.speed * dt;
    cop.y += Math.sin(cop.angle) * cop.speed * dt;
    // Menabrak pemain: dorong mobil pemain dan kurangi HP bila jalan kaki.
    if (d < 60) {
      if (state.player.inCar && state.player.car) {
        state.player.car.speed *= 0.7;
        state.player.car.x += (dx / d) * -30 * dt * 10;
        state.player.car.y += (dy / d) * -30 * dt * 10;
      } else if (d < 34) {
        state.player.hp -= 22 * dt;
        state.player.x -= (dx / d) * 60 * dt;
        state.player.y -= (dy / d) * 60 * dt;
      }
    }
  }
}
