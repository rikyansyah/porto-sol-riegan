// Traffic cars cruise the road grid; pedestrians stroll the sidewalks and
// scatter when something dangerous happens near them.
import { ROAD_X, ROAD_Y, ROAD_W, WORLD_W, WORLD_H } from './config.js';
import { clamp } from './random.js';

const CAR_COLORS = ['#e2703a', '#e8a13a', '#d94f4f', '#8ecae6', '#f2e3c6', '#7ec850', '#c084fc', '#f8fafc'];

export function makeCar(rng, x, y, opts = {}) {
  return {
    x, y, angle: opts.angle ?? 0, speed: 0, color: opts.color || rng.pick(CAR_COLORS),
    w: 38, h: 20, hp: 60, driver: opts.driver ?? true, parked: !!opts.parked,
    isPolice: !!opts.isPolice, isTarget: !!opts.isTarget, id: Math.floor(rng.rand(1, 1e9)),
    lane: rng.pick([-1, 1]), axis: null, target: null, honk: 0,
  };
}

export function spawnParked(rng, world) {
  const cars = [];
  const spots = [
    [640, 340], [1040, 740], [1540, 340], [2040, 1140], [640, 1540], [2440, 740],
    [840, 1940], [1840, 1940], [2840, 1140], [340, 840], [340, 1640], [2240, 340],
  ];
  for (const [x, y] of spots) cars.push(makeCar(rng, x + rng.rand(-14, 14), y + rng.rand(-14, 14), { parked: true, angle: rng.pick([0, Math.PI / 2, Math.PI, -Math.PI / 2]) }));
  // The yellow sedan Mara wants, parked near the market.
  const target = makeCar(rng, 860, 1060, { color: '#ffd21f', parked: true });
  target.isTarget = true;
  cars.push(target);
  return cars;
}

export function spawnTraffic(rng, n = 9) {
  const cars = [];
  for (let i = 0; i < n; i++) {
    const vertical = rng.chance(0.5);
    const road = vertical ? rng.pick(ROAD_X) : rng.pick(ROAD_Y);
    const along = rng.rand(120, vertical ? WORLD_H - 240 : WORLD_W - 240);
    const laneOff = rng.pick([-1, 1]) * (ROAD_W / 4);
    const car = vertical
      ? makeCar(rng, road + laneOff, along, { angle: laneOff > 0 ? Math.PI / 2 : -Math.PI / 2 })
      : makeCar(rng, along, road + laneOff, { angle: laneOff > 0 ? 0 : Math.PI });
    car.axis = vertical ? 'y' : 'x';
    car.speed = rng.rand(90, 150);
    cars.push(car);
  }
  return cars;
}

export function updateTraffic(state, dt) {
  for (const car of state.traffic) {
    if (car.parked || !car.driver) continue;
    // Simple obstacle check ahead.
    let blocked = false;
    const fx = car.x + Math.cos(car.angle) * 52, fy = car.y + Math.sin(car.angle) * 52;
    for (const other of [...state.traffic, ...state.policeCars, ...(state.player.car ? [state.player.car] : [])]) {
      if (other !== car && Math.hypot(other.x - fx, other.y - fy) < 30) { blocked = true; break; }
    }
    if (!blocked && Math.hypot(state.player.x - fx, state.player.y - fy) < 26 && !state.player.car) blocked = true;
    const targetSpeed = blocked ? 0 : 130;
    car.speed += clamp(targetSpeed - car.speed, -260 * dt, 90 * dt);
    let nx = car.x + Math.cos(car.angle) * car.speed * dt;
    let ny = car.y + Math.sin(car.angle) * car.speed * dt;
    // At the world edge or off its road axis, turn onto the nearest cross road.
    const offAxis = car.axis === 'y' ? !ROAD_X.some((rx) => Math.abs(nx - rx) < ROAD_W) : !ROAD_Y.some((ry) => Math.abs(ny - ry) < ROAD_W);
    if (nx < 90 || ny < 90 || nx > WORLD_W - 90 || ny > WORLD_H - 160 || offAxis) {
      car.angle += Math.PI / 2;
      car.axis = car.axis === 'y' ? 'x' : 'y';
      nx = car.x; ny = car.y;
    }
    car.x = clamp(nx, 60, WORLD_W - 60); car.y = clamp(ny, 60, WORLD_H - 60);
  }
}

export function spawnPeds(rng, n = 16) {
  const peds = [];
  const colors = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#f472b6', '#e7e5e4'];
  for (let i = 0; i < n; i++) {
    const vertical = rng.chance(0.5);
    const road = vertical ? rng.pick(ROAD_X) : rng.pick(ROAD_Y);
    const off = rng.pick([-1, 1]) * (ROAD_W / 2 + 14);
    const along = rng.rand(140, 2100);
    peds.push({
      x: vertical ? road + off : along, y: vertical ? along : road + off,
      angle: rng.rand(0, Math.PI * 2), speed: rng.rand(34, 58), hp: 30,
      color: rng.pick(colors), dir: rng.pick([-1, 1]), axis: vertical ? 'y' : 'x',
      road, off, flee: 0, dead: false, panic: 0,
    });
  }
  return peds;
}

export function updatePeds(state, dt) {
  for (const p of state.peds) {
    if (p.dead) continue;
    if (p.panic > 0) p.panic -= dt;
    const danger = state.lastShotAt && (state.time - state.lastShotAt < 2.5) &&
      Math.hypot(p.x - state.player.x, p.y - state.player.y) < 190;
    const fleeing = danger || p.panic > 0;
    const spd = fleeing ? 135 : p.speed;
    if (fleeing) p.angle = Math.atan2(p.y - state.player.y, p.x - state.player.x);
    else p.angle = p.axis === 'y' ? (p.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (p.dir > 0 ? 0 : Math.PI);
    let nx = p.x + Math.cos(p.angle) * spd * dt;
    let ny = p.y + Math.sin(p.angle) * spd * dt;
    if (!fleeing) {
      if (p.axis === 'y') { nx = p.road + p.off; if (ny < 80 || ny > 2180) p.dir *= -1; }
      else { ny = p.road + p.off; if (nx < 80 || nx > 3060) p.dir *= -1; }
    }
    if (!state.world.collides(nx, ny, 9)) { p.x = nx; p.y = ny; }
    else if (!fleeing) p.dir *= -1;
    p.x = clamp(p.x, 30, WORLD_W - 30); p.y = clamp(p.y, 30, WORLD_H - 30);
  }
}
