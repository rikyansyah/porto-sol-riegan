// Police response: patrol cars and foot officers scale with the wanted
// level, chase the player, and fill the bust meter when they pin a stopped
// player. Staying far away lets the heat cool off.
import { POLICE, WORLD_W, WORLD_H } from './config.js';
import { clamp } from './random.js';
import { setSiren, sfx } from './audio.js';

export function wantedCap(wanted) { return wanted <= 0 ? 0 : Math.min(6, 1 + wanted); }

export function addHeat(state, amount, witnessed = true) {
  if (!witnessed && amount < 1) return;
  state.wanted = clamp(state.wanted + amount, 0, 5);
  state.heatTimer = 0;
  if (amount >= 1) sfx.fail;
}

export function updatePolice(state, dt) {
  const want = wantedCap(Math.floor(state.wanted));
  // Spawn reinforcements at the map edge of the road grid.
  state.policeTimer -= dt;
  if (state.policeCars.length + state.cops.length < want && state.policeTimer <= 0 && state.wanted >= 1) {
    state.policeTimer = 2.5;
    const a = state.rng.rand(0, Math.PI * 2);
    const sx = clamp(state.player.x + Math.cos(a) * 620, 120, WORLD_W - 120);
    const sy = clamp(state.player.y + Math.sin(a) * 620, 120, WORLD_H - 200);
    if (state.wanted >= 2 && state.policeCars.length <= state.cops.length) {
      state.policeCars.push({ x: sx, y: sy, angle: 0, speed: 0, color: '#e5e7eb', w: 40, h: 21, hp: 90, isPolice: true, driver: true, parked: false });
    } else {
      state.cops.push({ x: sx, y: sy, angle: 0, hp: 40, speed: POLICE.footSpeed, color: '#1d4ed8', dead: false });
    }
  }
  // Despawn when the heat is gone.
  if (state.wanted < 1) {
    if (state.policeCars.length) state.policeCars.pop();
    if (state.cops.length) state.cops.pop();
  }
  setSiren(state.policeCars.length + state.cops.length > 0 && state.mode === 'play');

  const px = state.player.car ? state.player.car.x : state.player.x;
  const py = state.player.car ? state.player.car.y : state.player.y;
  let nearest = Infinity;
  for (const car of state.policeCars) {
    const d = Math.hypot(px - car.x, py - car.y); nearest = Math.min(nearest, d);
    const wantAngle = Math.atan2(py - car.y, px - car.x);
    let diff = wantAngle - car.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    car.angle += clamp(diff, -2.2 * dt, 2.2 * dt);
    const spd = d > 46 ? POLICE.speed : 40;
    car.speed += clamp(spd - car.speed, -300 * dt, 200 * dt);
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    if (!state.world.collides(nx, ny, 16)) { car.x = nx; car.y = ny; }
    else { car.speed = 0; car.angle += dt * 1.4; }
  }
  for (const cop of state.cops) {
    if (cop.dead) continue;
    const d = Math.hypot(px - cop.x, py - cop.y); nearest = Math.min(nearest, d);
    cop.angle = Math.atan2(py - cop.y, px - cop.x);
    if (d > 20) {
      const nx = cop.x + Math.cos(cop.angle) * cop.speed * dt;
      const ny = cop.y + Math.sin(cop.angle) * cop.speed * dt;
      if (!state.world.collides(nx, ny, 10)) { cop.x = nx; cop.y = ny; }
    }
  }
  // Heat cools when nobody is close.
  state.heatTimer += dt;
  const hiding = nearest > 430;
  if (hiding && state.wanted > 0 && state.heatTimer > 4) {
    state.wanted = Math.max(0, state.wanted - dt * 0.14);
  }
  // Bust meter: police touching a slow / on-foot player.
  const playerSpeed = state.player.car ? Math.abs(state.player.car.speed) : 0;
  const pinned = nearest < 34 && (!state.player.car || playerSpeed < 26);
  if (pinned && state.wanted >= 1) {
    state.bust = Math.min(1, state.bust + dt / POLICE.bustTime);
    if (state.bust >= 1) state.gameOver('busted');
  } else {
    state.bust = Math.max(0, state.bust - dt * 0.8);
  }
}
