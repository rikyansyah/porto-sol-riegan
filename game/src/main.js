// Porto Sol — boot and the fixed-timestep game loop. Owns the shared state
// object that every system reads and writes, the camera, driving, car
// theft, pickups, autosave and the title/play/paused/over/won machine.
import { WORLD_W, WORLD_H, VIEW_W, VIEW_H, STEP, PLAYER, CAR, MARA_SPOT } from './config.js';
import { makeRng, clamp, lerp } from './random.js';
import { buildWorld } from './world.js';
import { createInput } from './input.js';
import { initAudio, sfx } from './audio.js';
import { saveGame, loadGame } from './save.js';
import { spawnParked, spawnTraffic, spawnPeds, updateTraffic, updatePeds } from './traffic.js';
import { updatePolice, addHeat } from './police.js';
import { createCombat, updateCombat } from './combat.js';
import { createMissions, updateMissions, currentMarker, objectiveText } from './missions.js';
import { render } from './render.js';
import { parseShotParams, stageShot, signalShotReady } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const { shot, seed } = parseShotParams();
const rng = makeRng(seed);
const world = buildWorld(makeRng(seed + 77));
const saved = shot ? null : loadGame();

const state = {
  ctx, rng, world, time: 0, mode: 'title',
  input: createInput(canvas),
  camera: { x: 0, y: 0 },
  player: {
    x: saved?.x ?? 760, y: saved?.y ?? 900, angle: 0, aim: 0,
    hp: 100, money: saved?.money ?? 40, car: null, bag: false, color: '#f59e0b', flash: 0,
  },
  traffic: [], parked: [], peds: [], cops: [], policeCars: [],
  pickups: [], combat: createCombat(), missions: createMissions(),
  wanted: 0, heatTimer: 0, bust: 0, policeTimer: 0, banner: null,
  objective: '', marker: null, shotFx: null, lastShotAt: -99,
  overReason: null, hasSave: !!saved, saveTimer: 0, started: false,
  get allCars() { return [...this.traffic, ...this.parked]; },
  gameOver(reason) {
    if (this.mode !== 'play') return;
    this.mode = 'over'; this.overReason = reason; sfx.fail();
  },
  requestSave() { persist(); },
  updateCamera(dt) {
    const t = this.player.car || this.player;
    const tx = clamp(t.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
    const ty = clamp(t.y - VIEW_H / 2, 0, WORLD_H - VIEW_H);
    const k = dt >= 1 ? 1 : 1 - Math.pow(0.0015, dt);
    this.camera.x = lerp(this.camera.x, tx, k);
    this.camera.y = lerp(this.camera.y, ty, k);
  },
};
if (saved) {
  state.missions.index = clamp(saved.missionIndex ?? 0, 0, 4);
  if (state.missions.index >= 4) state.missions.done = true;
}
state.parked = spawnParked(makeRng(seed + 5), world);
state.traffic = spawnTraffic(makeRng(seed + 9), 9);
state.peds = spawnPeds(makeRng(seed + 13), 16);
state.camera.x = clamp(state.player.x - VIEW_W / 2, 0, WORLD_W - VIEW_W);
state.camera.y = clamp(state.player.y - VIEW_H / 2, 0, WORLD_H - VIEW_H);

function persist() {
  if (shot) return;
  saveGame({ x: Math.round(state.player.x), y: Math.round(state.player.y), money: state.player.money, missionIndex: state.missions.index });
}

function movePlayer(dt) {
  const p = state.player;
  const inp = state.input;
  if (p.car) {
    const car = p.car;
    const up = inp.down('KeyW') || inp.down('ArrowUp');
    const down = inp.down('KeyS') || inp.down('ArrowDown');
    const left = inp.down('KeyA') || inp.down('ArrowLeft');
    const right = inp.down('KeyD') || inp.down('ArrowRight');
    if (up) car.speed += CAR.accel * dt;
    else if (down) car.speed -= (car.speed > 10 ? CAR.brake : CAR.accel * 0.6) * dt;
    else car.speed -= car.speed * 0.7 * dt;
    car.speed = clamp(car.speed, -CAR.reverse, CAR.maxSpeed);
    if (Math.abs(car.speed) > 4) {
      const dir = car.speed > 0 ? 1 : -1;
      if (left) car.angle -= CAR.turn * dt * dir * Math.min(1, Math.abs(car.speed) / 120);
      if (right) car.angle += CAR.turn * dt * dir * Math.min(1, Math.abs(car.speed) / 120);
    }
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    if (!world.collides(nx, ny, 15)) { car.x = nx; car.y = ny; }
    else {
      if (Math.abs(car.speed) > 150) { sfx.crash(); hitEntities(car, 18); damagePlayer(4); addHeat(state, 0.4); }
      car.speed = -car.speed * 0.25;
    }
    hitEntities(car, Math.abs(car.speed) > 60 ? 22 : 0);
    p.x = car.x; p.y = car.y;
    if (inp.hit('KeyE')) { p.car = null; car.driver = false; p.x = car.x + 26; p.y = car.y + 10; sfx.door(); }
    return;
  }
  let dx = 0, dy = 0;
  if (inp.down('KeyW') || inp.down('ArrowUp')) dy -= 1;
  if (inp.down('KeyS') || inp.down('ArrowDown')) dy += 1;
  if (inp.down('KeyA') || inp.down('ArrowLeft')) dx -= 1;
  if (inp.down('KeyD') || inp.down('ArrowRight')) dx += 1;
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    const nx = p.x + (dx / len) * PLAYER.speed * dt;
    const ny = p.y + (dy / len) * PLAYER.speed * dt;
    if (!world.collides(nx, p.y, PLAYER.radius)) p.x = nx;
    if (!world.collides(p.x, ny, PLAYER.radius)) p.y = ny;
    p.angle = Math.atan2(dy, dx);
  }
  if (inp.hit('KeyE')) {
    let best = null, bd = 52;
    for (const car of state.allCars) {
      const d = Math.hypot(car.x - p.x, car.y - p.y);
      if (d < bd) { bd = d; best = car; }
    }
    if (best) {
      const wasParked = best.parked;
      best.parked = false; best.driver = true;
      state.parked = state.parked.filter((c) => c !== best);
      if (!state.traffic.includes(best)) state.traffic = state.traffic.filter((c) => c !== best);
      p.car = best; sfx.door();
      if (wasParked || !best.ownerSeen) {
        const witnesses = state.peds.filter((w) => !w.dead && Math.hypot(w.x - p.x, w.y - p.y) < 230).length + state.cops.length;
        if (witnesses > 0) { state.wanted = Math.min(5, state.wanted + 1); state.banner = { text: 'Mobil dicuri di depan saksi — wanted naik!', t: 3 }; }
      }
    }
  }
}

function hitEntities(car, dmg) {
  if (!dmg) return;
  for (const t of [...state.peds, ...state.cops]) {
    if (t.dead) continue;
    if (Math.hypot(t.x - car.x, t.y - car.y) >= 26) continue;
    if (state.time - (t._hitAt || -9) <= 1) continue;
    t.hp -= dmg; t.flash = 0.15; t.panic = 3; t._hitAt = state.time;
    if (t.hp <= 0) t.dead = true;
    state.wanted = Math.min(5, state.wanted + 0.5);
    sfx.crash();
  }
}
function damagePlayer(n) {
  state.player.hp -= n;
  if (state.player.hp <= 0) { state.player.hp = 0; state.gameOver('wasted'); }
}

function update(dt) {
  state.time += dt;
  if (state.banner) { state.banner.t -= dt; if (state.banner.t <= 0) state.banner = null; }
  for (const e of [...state.peds, ...state.cops]) if (e.flash > 0) e.flash -= dt;
  for (const c of state.allCars) if (c.flash > 0) c.flash -= dt;
  if (state.mode !== 'play') return;
  movePlayer(dt);
  updateTraffic(state, dt);
  updatePeds(state, dt);
  updateCombat(state, dt);
  updatePolice(state, dt);
  updateMissions(state, dt);
  // Police contact damage on foot.
  if (!state.player.car) {
    for (const cop of state.cops) if (!cop.dead && Math.hypot(cop.x - state.player.x, cop.y - state.player.y) < 20) damagePlayer(6 * dt * 10 * 0.16);
  }
  // Slow HP regen when calm and un-wanted.
  if (state.wanted < 1 && state.player.hp > 0) state.player.hp = Math.min(100, state.player.hp + dt * 1.6);
  // Pickups.
  for (const pk of [...state.pickups]) {
    pk.t += dt;
    if (Math.hypot(pk.x - state.player.x, pk.y - state.player.y) < 26) {
      state.player.money += pk.amount; state.pickups = state.pickups.filter((q) => q !== pk); sfx.pickup();
    } else if (pk.t > 25) state.pickups = state.pickups.filter((q) => q !== pk);
  }
  state.marker = currentMarker(state);
  state.objective = objectiveText(state);
  state.saveTimer += dt;
  if (state.saveTimer > 10) { state.saveTimer = 0; persist(); }
}

function handleModeKeys() {
  const inp = state.input;
  if (inp.hit('Enter')) {
    if (state.mode === 'title') { state.mode = 'play'; state.started = true; initAudio(); }
    else if (state.mode === 'over') { resetRun(); state.mode = 'play'; }
    else if (state.mode === 'won') { state.mode = 'play'; }
  }
  if ((inp.hit('KeyP') || inp.hit('Escape')) && (state.mode === 'play' || state.mode === 'paused')) {
    state.mode = state.mode === 'play' ? 'paused' : 'play';
  }
  if (inp.mouse.clicked) initAudio();
}
function resetRun() {
  state.player.hp = 100; state.player.x = 760; state.player.y = 900; state.player.car = null;
  state.wanted = 0; state.bust = 0; state.policeCars = []; state.cops = [];
}

if (shot) stageShot(state, shot);
state.marker = currentMarker(state);
state.objective = objectiveText(state);

let last = performance.now();
let acc = 0;
let shotSignalled = false;
function frame(now) {
  requestAnimationFrame(frame);
  acc += Math.min((now - last) / 1000, 0.25); last = now;
  handleModeKeys();
  while (acc >= STEP) { update(STEP); acc -= STEP; }
  state.updateCamera(state.mode === 'play' ? 0.05 : 1);
  render(state);
  state.input.endFrame();
  if (shot && !shotSignalled) { shotSignalled = true; signalShotReady(state); }
}
requestAnimationFrame(frame);
