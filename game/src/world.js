// Porto Sol — generasi kota dan state dunia.
// Jalan grid, blok bangunan warna-warni, pantai barat, pelabuhan selatan,
// taman tengah, Bank Sol, bengkel Rico, dan tempat persembunyian.
// Step dunia memanggil lalu lintas, polisi, misi, dan combat tiap frame.
import { WORLD, ROAD_X, ROAD_Y, ROAD, COLORS, CAR_COLORS, HIDEOUT, BANK, MISSIONS, PLAYER, CAR } from './config.js';
import { updateTraffic } from './traffic.js';
import { updatePolice } from './police.js';
import { updateMissions } from './missions.js';
import { updateCombat } from './combat.js';

export const EVENT_OVER = 1;
export const EVENT_MISSION = 2;
export const EVENT_WANTED = 4;

export function isOnRoad(x, y) {
  for (const rx of ROAD_X) if (Math.abs(x - rx) < ROAD.width / 2) return true;
  for (const ry of ROAD_Y) if (Math.abs(y - ry) < ROAD.width / 2) return true;
  return false;
}
export function nearestRoadX(x) { let b = ROAD_X[0]; for (const rx of ROAD_X) if (Math.abs(rx - x) < Math.abs(b - x)) b = rx; return b; }
export function nearestRoadY(y) { let b = ROAD_Y[0]; for (const ry of ROAD_Y) if (Math.abs(ry - y) < Math.abs(b - y)) b = ry; return b; }
export function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

function collideBuildings(state, x, y, r) {
  for (const b of state.buildings) {
    const cx = Math.max(b.x, Math.min(x, b.x + b.w));
    const cy = Math.max(b.y, Math.min(y, b.y + b.h));
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
    if (d < r && d > 0.001) { x = cx + (dx / d) * r; y = cy + (dy / d) * r; }
    else if (d <= 0.001) { x += r; }
  }
  return { x, y };
}

function generateCity(rng) {
  const buildings = [];
  for (let ix = 0; ix < ROAD_X.length - 1; ix++) {
    for (let iy = 0; iy < ROAD_Y.length - 1; iy++) {
      const x0 = ROAD_X[ix] + ROAD.width / 2 + 12, x1 = ROAD_X[ix + 1] - ROAD.width / 2 - 12;
      const y0 = ROAD_Y[iy] + ROAD.width / 2 + 12, y1 = ROAD_Y[iy + 1] - ROAD.width / 2 - 12;
      // Taman tengah: blok 1000-1400 x 1000-1400 tetap hijau tanpa bangunan.
      if (x0 >= 1000 && x0 < 1400 && y0 >= 1000 && y0 < 1400) continue;
      // Pelabuhan selatan: blok paling bawah dibiarkan lapang untuk kontainer.
      if (y0 > 2100) continue;
      const n = rng.int(2, 4);
      for (let k = 0; k < n; k++) {
        const w = rng.range(70, 130), h = rng.range(70, 130);
        const bx = rng.range(x0, Math.max(x0 + 1, x1 - w));
        const by = rng.range(y0, Math.max(y0 + 1, y1 - h));
        const ci = rng.int(0, COLORS.building.length - 1);
        buildings.push({ x: bx, y: by, w, h, color: COLORS.building[ci], roof: COLORS.roof[ci], windows: rng.int(2, 5) });
      }
    }
  }
  return buildings;
}

export function createWorld(rng) {
  const state = {
    time: 0, cash: 0, wanted: 0, wantedHeat: 0, kills: 0, carsStolen: 0,
    player: { x: 600, y: 1400, angle: -Math.PI / 2, hp: PLAYER.hp, ammo: 24, inCar: false, car: null, speed: 0 },
    camera: { x: 600, y: 1400 },
    cars: [], peds: [], policeCars: [], enemies: [], bullets: [], pickups: [],
    buildings: [], mission: { index: 0, stage: 0, timer: 0, packages: [false, false, false], text: '', marker: null, done: false },
    message: '', messageTimer: 0, over: false, won: false, hideTimer: 0,
  };

  function spawnCars() {
    state.cars = [];
    // Mobil parkir yang bisa dicuri, tersebar di jalan.
    const spots = [[600, 648, 0], [1000, 252, 1], [1800, 1048, 2], [2200, 648, 3], [1400, 1848, 4], [2600, 1448, 5], [600, 2248, 6], [3000, 1048, 0]];
    for (let i = 0; i < spots.length; i++) {
      const [x, y, ci] = spots[i];
      state.cars.push({ id: i, x, y, angle: rng.pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]), speed: 0, color: CAR_COLORS[ci], parked: true, ai: false, police: false });
    }
    // Mobil AI lalu lintas.
    for (let i = 0; i < 14; i++) {
      const vertical = rng.chance(0.5);
      const road = vertical ? rng.pick(ROAD_X) : rng.pick(ROAD_Y);
      state.cars.push({
        id: 100 + i, x: vertical ? road + (rng.chance(0.5) ? -ROAD.lane : ROAD.lane) : rng.range(200, 3000),
        y: vertical ? rng.range(200, 2200) : road + (rng.chance(0.5) ? -ROAD.lane : ROAD.lane),
        angle: vertical ? (rng.chance(0.5) ? Math.PI / 2 : -Math.PI / 2) : (rng.chance(0.5) ? 0 : Math.PI),
        speed: rng.range(90, 150), color: rng.pick(CAR_COLORS), parked: false, ai: true, police: false,
      });
    }
    // Sedan kuning target misi 1, dekat pelabuhan.
    state.cars[0].color = '#f2b705'; state.cars[0].x = 600; state.cars[0].y = 2150;
  }

  function spawnPeds() {
    state.peds = [];
    for (let i = 0; i < 26; i++) {
      const rx = rng.pick(ROAD_X), ry = rng.pick(ROAD_Y);
      const onVertical = rng.chance(0.5);
      state.peds.push({
        x: onVertical ? rx + (rng.chance(0.5) ? 62 : -62) : rng.range(200, 3000),
        y: onVertical ? rng.range(200, 2200) : ry + (rng.chance(0.5) ? 62 : -62),
        angle: rng.range(0, Math.PI * 2), speed: rng.range(28, 55),
        tx: 0, ty: 0, color: rng.pick(['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#ecf0f1', '#1abc9c']),
        wait: 0,
      });
    }
  }

  function spawnPickups() {
    state.pickups = [
      { x: 300, y: 600, kind: 'health', taken: false },
      { x: 1800, y: 1000, kind: 'ammo', taken: false },
      { x: 2600, y: 600, kind: 'health', taken: false },
      { x: 1000, y: 1800, kind: 'cash', taken: false, amount: 150 },
      { x: 2200, y: 1800, kind: 'ammo', taken: false },
      { x: 1400, y: 2200, kind: 'cash', taken: false, amount: 200 },
    ];
  }

  function reset() {
    state.time = 0; state.cash = 0; state.wanted = 0; state.wantedHeat = 0;
    state.kills = 0; state.carsStolen = 0; state.over = false; state.won = false;
    state.player = { x: 600, y: 1400, angle: -Math.PI / 2, hp: PLAYER.hp, ammo: 24, inCar: false, car: null, speed: 0 };
    state.camera = { x: 600, y: 1400 };
    state.policeCars = []; state.enemies = []; state.bullets = [];
    state.buildings = generateCity(rng);
    state.mission = { index: 0, stage: 0, timer: 0, packages: [false, false, false], text: MISSIONS[0].brief, marker: { x: 600, y: 2150 }, done: false };
    state.message = 'Mara: "Selamat datang di Porto Sol. Cari sedan kuning itu."';
    state.messageTimer = 6;
    spawnCars(); spawnPeds(); spawnPickups();
  }

  function drivePlayer(dt, axis) {
    const p = state.player, car = p.car;
    if (!car) return;
    const forward = axis.y < 0 ? 1 : axis.y > 0 ? -0.55 : 0;
    const throttle = axis.y !== 0;
    if (throttle) car.speed += forward * CAR.accel * dt * (forward > 0 ? 1 : 1);
    else car.speed *= Math.pow(0.4, dt);
    if (axis.handbrake) car.speed *= Math.pow(0.02, dt);
    car.speed = Math.max(-CAR.maxReverse, Math.min(CAR.maxSpeed, car.speed));
    if (Math.abs(car.speed) > 8) {
      const steer = (axis.x) * CAR.turn * dt * Math.sign(car.speed) * (1 - Math.min(0.55, Math.abs(car.speed) / 1200));
      car.angle += steer;
      // Drift ringan saat belok kencang dengan rem tangan.
      if (axis.handbrake && Math.abs(car.speed) > 150) car.angle += axis.x * 0.9 * dt;
    }
    const nx = car.x + Math.cos(car.angle) * car.speed * dt;
    const ny = car.y + Math.sin(car.angle) * car.speed * dt;
    const hit = collideBuildings(state, nx, ny, CAR.length / 2);
    if (hit.x !== nx || hit.y !== ny) car.speed *= 0.35;
    car.x = Math.max(60, Math.min(WORLD.width - 60, hit.x));
    car.y = Math.max(60, Math.min(WORLD.height - 60, hit.y));
    p.x = car.x; p.y = car.y; p.angle = car.angle; p.speed = car.speed;
    // Tabrakan dengan mobil lain: dorong dan perlambat; mobil parkir yang
    // tertabrak ikut melaju sebagai lalu lintas (tidak lagi parkir).
    for (const o of state.cars) {
      if (o === car || o.police) continue;
      if (dist(car.x, car.y, o.x, o.y) < 52) { car.speed *= 0.55; o.speed = Math.max(o.speed, 40); o.parked = false; o.ai = true; }
    }
  }

  function walkPlayer(dt, axis) {
    const p = state.player;
    const speed = axis.run ? PLAYER.runSpeed : PLAYER.walkSpeed;
    let mx = axis.x, my = axis.y;
    const len = Math.hypot(mx, my);
    if (len > 0) { mx /= len; my /= len; p.angle = Math.atan2(my, mx); }
    const nx = p.x + mx * speed * dt, ny = p.y + my * speed * dt;
    const hit = collideBuildings(state, nx, ny, PLAYER.radius);
    p.x = Math.max(30, Math.min(WORLD.width - 30, hit.x));
    p.y = Math.max(30, Math.min(WORLD.height - 30, hit.y));
    p.speed = len > 0 ? speed : 0;
  }

  function tryEnterExitCar() {
    const p = state.player;
    if (p.inCar) {
      const car = p.car;
      p.inCar = false; p.car = null;
      p.x = car.x + Math.cos(car.angle + Math.PI / 2) * 40;
      p.y = car.y + Math.sin(car.angle + Math.PI / 2) * 40;
      car.speed = 0;
      return;
    }
    let best = null, bd = 70;
    for (const c of state.cars) {
      if (c.police) continue;
      const d = dist(p.x, p.y, c.x, c.y);
      if (d < bd) { bd = d; best = c; }
    }
    if (best) {
      p.inCar = true; p.car = best;
      if (best.parked) {
        best.parked = false; state.carsStolen += 1;
        state.message = 'Mobil dicuri! Polisi Porto Sol mulai mengendusmu.';
        state.messageTimer = 4;
        if (state.wanted < 1) { state.wanted = 1; state.wantedHeat = 40; }
      }
    }
  }

  function step(dt, input, opts = {}) {
    if (state.over) return 0;
    state.time += dt;
    const axis = input.axis();
    // Aksi (masuk mobil / tembak) datang lewat opts dari main.js, sekali per frame.
    if (opts.enterCar) tryEnterExitCar();
    if (state.player.inCar) drivePlayer(dt, axis); else walkPlayer(dt, axis);
    // Kamera mengikuti pemain dengan halus, dijepit agar tidak pernah
    // menampilkan luar dunia (area gelap di luar peta).
    state.camera.x += (state.player.x - state.camera.x) * Math.min(1, dt * 5);
    state.camera.y += (state.player.y - state.camera.y) * Math.min(1, dt * 5);
    state.camera.x = Math.max(640, Math.min(WORLD.width - 640, state.camera.x));
    state.camera.y = Math.max(400, Math.min(WORLD.height - 400, state.camera.y));
    updateTraffic(state, dt);
    updatePolice(state, dt);
    const me = updateMissions(state, dt);
    updateCombat(state, dt, opts);
    // Pickup: uang, health, amunisi.
    for (const pk of state.pickups) {
      if (pk.taken) continue;
      if (dist(state.player.x, state.player.y, pk.x, pk.y) < 34) {
        pk.taken = true;
        if (pk.kind === 'health') { state.player.hp = Math.min(100, state.player.hp + 40); state.message = '+40 HP'; }
        else if (pk.kind === 'ammo') { state.player.ammo += 24; state.message = '+24 amunisi'; }
        else { state.cash += pk.amount; state.message = `+$${pk.amount} uang jalanan`; }
        state.messageTimer = 3;
      }
    }
    if (state.messageTimer > 0) state.messageTimer -= dt;
    // Wanted mereda bila pemain lama tak terlihat polisi.
    if (state.wanted > 0) {
      const nearCop = state.policeCars.some((c) => dist(state.player.x, state.player.y, c.x, c.y) < 420);
      if (!nearCop) { state.hideTimer += dt; if (state.hideTimer > 12) { state.wanted = Math.max(0, state.wanted - 1); state.wantedHeat = 30; state.hideTimer = 0; state.message = 'Kamu lolos dari pandangan polisi. Wanted turun.'; state.messageTimer = 4; } }
      else state.hideTimer = 0;
    }
    if (state.player.hp <= 0) { state.over = true; return EVENT_OVER; }
    if (state.mission.done && state.mission.index >= MISSIONS.length) { state.won = true; state.over = true; return EVENT_OVER | EVENT_MISSION; }
    return me ? EVENT_MISSION : 0;
  }

  reset();
  return { state, reset, step, tryEnterExitCar, collideBuildings };
}
