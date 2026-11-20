// Combat: mouse-aimed pistol with a small magazine and reload, plus a
// short-range punch. Hits flash, targets drop a little cash, and gunfire
// panics nearby pedestrians and raises heat when witnessed.
import { sfx } from './audio.js';

export function createCombat() {
  return { ammo: 12, mag: 12, reserve: 48, reloading: 0, cooldown: 0, muzzle: 0, swing: 0 };
}

function nearestAlong(state, ox, oy, angle, range) {
  let best = null, bestD = range;
  const all = [...state.peds, ...state.cops];
  for (const t of all) {
    if (t.dead || t.hp <= 0) continue;
    const dx = t.x - ox, dy = t.y - oy;
    const d = Math.hypot(dx, dy);
    if (d > range || d < 4) continue;
    let diff = Math.atan2(dy, dx) - angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    if (Math.abs(diff) < 0.16 && d < bestD) { best = t; bestD = d; }
  }
  return best;
}

export function updateCombat(state, dt) {
  const c = state.combat;
  c.cooldown = Math.max(0, c.cooldown - dt);
  c.muzzle = Math.max(0, c.muzzle - dt);
  c.swing = Math.max(0, c.swing - dt);
  if (c.reloading > 0) {
    c.reloading -= dt;
    if (c.reloading <= 0) {
      const take = Math.min(c.mag - c.ammo, c.reserve);
      c.ammo += take; c.reserve -= take;
    }
  }
  const inp = state.input;
  if (inp.hit('KeyR') && c.reloading <= 0 && c.ammo < c.mag && c.reserve > 0) { c.reloading = 0.9; sfx.reload(); }

  const origin = state.player.car ? state.player.car : state.player;
  const aim = Math.atan2(inp.mouse.y - 400, inp.mouse.x - 640);
  state.player.aim = state.player.car ? state.player.car.angle : aim;

  const wantPunch = inp.hit('Space');
  const wantShoot = inp.mouse.clicked && !state.player.car;
  if (wantPunch && c.swing <= 0 && !state.player.car) {
    c.swing = 0.28; sfx.punch();
    const t = nearestAlong(state, origin.x, origin.y, aim, 40);
    if (t) hurt(state, t, 14);
  }
  if (wantShoot && c.cooldown <= 0 && c.reloading <= 0 && !state.player.car) {
    if (c.ammo <= 0) { c.reloading = 0.9; sfx.reload(); return; }
    c.ammo--; c.cooldown = 0.22; c.muzzle = 0.06;
    state.lastShotAt = state.time;
    sfx.shot();
    for (const p of state.peds) if (Math.hypot(p.x - origin.x, p.y - origin.y) < 200) p.panic = 2.5;
    const witnessed = state.peds.some((p) => !p.dead && Math.hypot(p.x - origin.x, p.y - origin.y) < 260) || state.cops.length > 0;
    if (witnessed) state.wanted = Math.min(5, state.wanted + 0.6);
    const t = nearestAlong(state, origin.x, origin.y, aim, 460);
    state.shotFx = { x1: origin.x, y1: origin.y, x2: t ? t.x : origin.x + Math.cos(aim) * 460, y2: t ? t.y : origin.y + Math.sin(aim) * 460, t: 0.07 };
    if (t) hurt(state, t, 34);
  }
  if (state.shotFx) { state.shotFx.t -= dt; if (state.shotFx.t <= 0) state.shotFx = null; }
}

export function hurt(state, target, dmg) {
  target.hp -= dmg;
  target.flash = 0.15;
  target.panic = 3;
  if (target.hp <= 0 && !target.dead) {
    target.dead = true;
    const cash = 5 + Math.floor(state.rng.rand(0, 16));
    state.pickups.push({ x: target.x, y: target.y, amount: cash, t: 0 });
    if (state.cops.includes(target)) state.wanted = Math.min(5, state.wanted + 1);
  }
}
