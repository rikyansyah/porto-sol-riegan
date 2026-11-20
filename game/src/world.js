// Porto Sol city builder. From a seed it lays out warm tropical blocks,
// palms, lamps, a park, a market square, the harbour and the beaches on the
// south and east edges, plus the named places the story needs.
import { WORLD_W, WORLD_H, ROAD_X, ROAD_Y, ROAD_W, PALETTE, BANK, RICO_GARAGE, MARKET, HIDEOUT } from './config.js';

export function isRoad(x, y) {
  const half = ROAD_W / 2;
  return ROAD_X.some((rx) => Math.abs(x - rx) < half) || ROAD_Y.some((ry) => Math.abs(y - ry) < half);
}
export function isWater(x, y) { return y > 2280 || x > 3080; }
export function isBeach(x, y) { return (y > 2180 && y <= 2280) || (x > 2980 && x <= 3080); }

export function buildWorld(rng) {
  const buildings = [];
  const trees = [];
  const lamps = [];
  const roofs = [PALETTE.roofA, PALETTE.roofB, PALETTE.roofC, PALETTE.roofD, PALETTE.roofE];
  const names = ['Casa Sol', 'Hotel Brisa', 'Toko Kopi', 'Bar Ombak', 'Vila Palem', 'Kantor Pos', 'Apotek Luna', 'Resto Asin', 'Galeri Karang', 'Hostel Ombak'];
  for (let bx = 0; bx < ROAD_X.length - 1; bx++) {
    for (let by = 0; by < ROAD_Y.length - 1; by++) {
      const x0 = ROAD_X[bx] + ROAD_W / 2 + 18, x1 = ROAD_X[bx + 1] - ROAD_W / 2 - 18;
      const y0 = ROAD_Y[by] + ROAD_W / 2 + 18, y1 = ROAD_Y[by + 1] - ROAD_W / 2 - 18;
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      // Special blocks stay clear: park/hideout, market, bank plaza.
      if (Math.hypot(cx - HIDEOUT.x, cy - HIDEOUT.y) < 260) continue;
      if (Math.hypot(cx - MARKET.x, cy - MARKET.y) < 200) continue;
      const w = x1 - x0, h = y1 - y0;
      const bw = w * rng.rand(0.55, 0.8), bh = h * rng.rand(0.55, 0.8);
      buildings.push({ x: cx - bw / 2, y: cy - bh / 2, w: bw, h: bh, color: rng.pick(roofs), name: rng.pick(names), floors: rng.int(2, 6) });
      for (let t = 0; t < 3; t++) trees.push({ x: x0 + rng.rand(6, w - 6), y: y0 + rng.rand(6, h - 6), r: rng.rand(9, 15) });
    }
  }
  // Named landmarks sit on top of the generic blocks.
  buildings.push({ x: BANK.x - 90, y: BANK.y - 70, w: 180, h: 140, color: '#f2e3c6', name: 'BANK SOL', landmark: 'bank', floors: 4 });
  buildings.push({ x: RICO_GARAGE.x - 80, y: RICO_GARAGE.y - 55, w: 160, h: 110, color: '#8ecae6', name: "RICO'S GARAGE", landmark: 'garage', floors: 1 });
  // Harbour crates and boats along the south-east water.
  const crates = [];
  for (let i = 0; i < 14; i++) crates.push({ x: 2350 + rng.rand(0, 620), y: 2050 + rng.rand(0, 120), w: 34, h: 26, color: rng.pick(roofs) });
  const boats = [];
  for (let i = 0; i < 6; i++) boats.push({ x: 2650 + i * 85 + rng.rand(-12, 12), y: 2335 + rng.rand(0, 30), a: rng.rand(-0.2, 0.2) });
  // Park trees ring the hideout; palms line the beach.
  for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2; trees.push({ x: HIDEOUT.x + Math.cos(a) * rng.rand(60, 170), y: HIDEOUT.y + Math.sin(a) * rng.rand(60, 170), r: rng.rand(11, 18) }); }
  for (let x = 120; x < 3000; x += 130) trees.push({ x: x + rng.rand(-20, 20), y: 2215 + rng.rand(-14, 14), r: rng.rand(10, 16), palm: true });
  for (let y = 200; y < 2150; y += 160) trees.push({ x: 3025 + rng.rand(-12, 12), y, r: rng.rand(10, 15), palm: true });
  for (const rx of ROAD_X) for (const ry of ROAD_Y) lamps.push({ x: rx + ROAD_W / 2 + 8, y: ry + ROAD_W / 2 + 8 });

  const solids = buildings.map((b) => ({ x: b.x, y: b.y, w: b.w, h: b.h }));
  function collides(x, y, r) {
    if (x < r || y < r || x > WORLD_W - r || y > WORLD_H - r) return true;
    if (isWater(x, y)) return true;
    for (const s of solids) if (x + r > s.x && x - r < s.x + s.w && y + r > s.y && y - r < s.y + s.h) return true;
    return false;
  }
  return { buildings, trees, lamps, crates, boats, solids, collides, isRoad, isWater, isBeach };
}
