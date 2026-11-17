// Combat Porto Sol: pukul jarak dekat (klik saat musuh dekat) dan pistol
// (bidik mouse, klik tembak, amunisi terbatas). Musuh dan penjaga bank
// menembak balik; peluru pemain dan musuh sama-sama dihitung di sini.
import { dist } from './world.js';
import { raiseWanted } from './police.js';

export function updateCombat(state, dt, opts = {}) {
  const p = state.player;
  // Tembakan pemain: dari posisi pemain ke arah mouse (sudut sudah dihitung main.js).
  // Bila amunisi habis, klik berubah menjadi pukulan jarak dekat.
  if (opts.shoot && opts.aimAngle !== undefined) {
    if (p.ammo > 0) {
      p.ammo -= 1;
      state.bullets.push({
        x: p.x + Math.cos(opts.aimAngle) * 22, y: p.y + Math.sin(opts.aimAngle) * 22,
        vx: Math.cos(opts.aimAngle) * 620, vy: Math.sin(opts.aimAngle) * 620,
        life: 0.9, from: 'player',
      });
      if (state.wanted < 2) raiseWanted(state, 2);
    } else if (opts.melee) {
      // Tanpa amunisi, klik menjadi pukulan.
      meleeHit(state, opts.aimAngle);
    }
  }
  if (opts.melee) meleeHit(state, opts.aimAngle ?? p.angle);
  // Musuh menembak pemain bila dalam jarak.
  for (const e of state.enemies) {
    const d = dist(e.x, e.y, p.x, p.y);
    if (d < 420 && d > 30) {
      e.angle = Math.atan2(p.y - e.y, p.x - e.x);
      e.cool = (e.cool || 0) - dt;
      if (e.cool <= 0) {
        e.cool = 1.4;
        state.bullets.push({ x: e.x, y: e.y, vx: Math.cos(e.angle) * 380, vy: Math.sin(e.angle) * 380, life: 1.1, from: 'enemy' });
      }
      // Musuh berjalan mendekat.
      e.x += Math.cos(e.angle) * e.speed * dt * 0.5;
      e.y += Math.sin(e.angle) * e.speed * dt * 0.5;
    }
  }
  // Gerak peluru + tabrakan.
  for (const b of state.bullets) {
    b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
    if (b.from === 'player') {
      for (const e of state.enemies) {
        if (e.hp > 0 && dist(b.x, b.y, e.x, e.y) < 20) { e.hp -= 34; b.life = 0; if (e.hp <= 0) { state.kills += 1; state.cash += 50; } }
      }
      for (const cop of state.policeCars) {
        if (dist(b.x, b.y, cop.x, cop.y) < 30) { b.life = 0; cop.speed *= 0.4; }
      }
    } else if (dist(b.x, b.y, p.x, p.y) < 16) {
      p.hp -= 8; b.life = 0;
    }
  }
  state.bullets = state.bullets.filter((b) => b.life > 0);
  state.enemies = state.enemies.filter((e) => e.hp > 0);
}

function meleeHit(state, angle) {
  const p = state.player;
  const hx = p.x + Math.cos(angle) * 30, hy = p.y + Math.sin(angle) * 30;
  for (const e of state.enemies) {
    if (dist(hx, hy, e.x, e.y) < 34) { e.hp -= 25; if (e.hp <= 0) { state.kills += 1; state.cash += 50; } }
  }
  // Pukulan ke pejalan kaki menaikkan wanted (kejahatan jalanan).
  for (const ped of state.peds) {
    if (dist(hx, hy, ped.x, ped.y) < 30) { ped.x += Math.cos(angle) * 60; ped.y += Math.sin(angle) * 60; raiseWanted(state, 1); }
  }
}
