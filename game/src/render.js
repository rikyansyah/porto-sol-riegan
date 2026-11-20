// All drawing: the city, entities, effects, HUD, minimap and full-screen
// panels. The camera centres on the player (or their car) in world space.
import { WORLD_W, WORLD_H, VIEW_W, VIEW_H, ROAD_X, ROAD_Y, ROAD_W, PALETTE, HIDEOUT, BANK } from './config.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

export function drawCar(ctx, car, time) {
  ctx.save(); ctx.translate(car.x, car.y); ctx.rotate(car.angle);
  if (car.flash > 0) { ctx.shadowColor = '#fff'; ctx.shadowBlur = 12; }
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; rr(ctx, -car.w / 2 + 2, -car.h / 2 + 3, car.w, car.h, 6); ctx.fill();
  ctx.fillStyle = car.color; rr(ctx, -car.w / 2, -car.h / 2, car.w, car.h, 6); ctx.fill();
  ctx.fillStyle = 'rgba(20,30,45,0.85)'; rr(ctx, -6, -car.h / 2 + 3, 15, car.h - 6, 3); ctx.fill();
  ctx.fillStyle = '#111'; ctx.fillRect(-car.w / 2 + 3, -car.h / 2 - 2, 8, 4); ctx.fillRect(-car.w / 2 + 3, car.h / 2 - 2, 8, 4);
  ctx.fillRect(car.w / 2 - 11, -car.h / 2 - 2, 8, 4); ctx.fillRect(car.w / 2 - 11, car.h / 2 - 2, 8, 4);
  if (car.isPolice) {
    ctx.fillStyle = '#1d4ed8'; ctx.fillRect(-10, -4, 20, 8);
    const blink = Math.floor(time * 4) % 2 === 0;
    ctx.fillStyle = blink ? '#ef4444' : '#3b82f6';
    ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111827'; ctx.font = 'bold 7px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('POLISI', 0, -car.h / 2 - 4);
  }
  if (car.isTarget) { ctx.strokeStyle = '#ffd21f'; ctx.lineWidth = 2; rr(ctx, -car.w / 2 - 3, -car.h / 2 - 3, car.w + 6, car.h + 6, 8); ctx.stroke(); }
  ctx.restore();
}

function drawPerson(ctx, p, isPlayer, time) {
  ctx.save(); ctx.translate(p.x, p.y);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(0, 3, 9, 5, 0, 0, Math.PI * 2); ctx.fill();
  const walk = Math.sin(time * 10 + p.x * 0.1) * 2;
  ctx.fillStyle = '#26324a'; ctx.fillRect(-6, 2, 5, 7 + walk * 0.3); ctx.fillRect(1, 2, 5, 7 - walk * 0.3);
  ctx.fillStyle = p.color || '#f59e0b'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f2c09a'; ctx.beginPath(); ctx.arc(0, -1, 5.5, 0, Math.PI * 2); ctx.fill();
  if (p.flash > 0) { ctx.fillStyle = 'rgba(239,68,68,0.55)'; ctx.beginPath(); ctx.arc(0, 0, 11, 0, Math.PI * 2); ctx.fill(); }
  if (isPlayer) {
    const a = p.aim ?? 0;
    ctx.strokeStyle = '#374151'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); ctx.lineTo(Math.cos(a) * 15, Math.sin(a) * 15); ctx.stroke();
    if (p.bag) { ctx.fillStyle = '#16a34a'; rr(ctx, 6, -12, 12, 10, 3); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('$', 12, -4); }
  }
  ctx.restore();
}

export function render(state) {
  const ctx = state.ctx;
  const cam = state.camera;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = PALETTE.waterDeep; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.save(); ctx.translate(-cam.x, -cam.y);
  const vx = cam.x - 40, vy = cam.y - 40, vw = VIEW_W + 80, vh = VIEW_H + 80;
  // Ground: grass, then park, beach and water.
  ctx.fillStyle = PALETTE.grass; ctx.fillRect(vx, vy, vw, vh);
  ctx.fillStyle = PALETTE.park; ctx.beginPath(); ctx.arc(HIDEOUT.x, HIDEOUT.y, 190, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = PALETTE.sand; ctx.fillRect(0, 2180, WORLD_W, 100); ctx.fillRect(2980, 0, 100, WORLD_H);
  ctx.fillStyle = PALETTE.water; ctx.fillRect(0, 2280, WORLD_W, 120); ctx.fillRect(3080, 0, 120, WORLD_H);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2;
  for (let i = 0; i < 8; i++) { const y = 2310 + i * 12 + Math.sin(state.time * 1.4 + i) * 3; ctx.beginPath(); ctx.moveTo(Math.max(0, vx), y); ctx.lineTo(Math.min(WORLD_W, vx + vw), y); ctx.stroke(); }
  // Sidewalks and roads.
  ctx.fillStyle = PALETTE.sidewalk;
  for (const rx of ROAD_X) ctx.fillRect(rx - ROAD_W / 2 - 12, 0, ROAD_W + 24, WORLD_H);
  for (const ry of ROAD_Y) ctx.fillRect(0, ry - ROAD_W / 2 - 12, WORLD_W, ROAD_W + 24);
  ctx.fillStyle = PALETTE.road;
  for (const rx of ROAD_X) ctx.fillRect(rx - ROAD_W / 2, 0, ROAD_W, WORLD_H);
  for (const ry of ROAD_Y) ctx.fillRect(0, ry - ROAD_W / 2, WORLD_W, ROAD_W);
  ctx.strokeStyle = PALETTE.roadLine; ctx.lineWidth = 3; ctx.setLineDash([22, 18]);
  for (const rx of ROAD_X) { ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx, WORLD_H); ctx.stroke(); }
  for (const ry of ROAD_Y) { ctx.beginPath(); ctx.moveTo(0, ry); ctx.lineTo(WORLD_W, ry); ctx.stroke(); }
  ctx.setLineDash([]);
  // Market stalls.
  ctx.fillStyle = '#b45309'; ctx.fillRect(910, 930, 180, 12);
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#ef4444' : '#f59e0b'; ctx.fillRect(918 + i * 34, 942, 28, 22); }
  // Buildings, crates, trees, lamps.
  for (const b of state.world.buildings) {
    if (b.x + b.w < vx || b.y + b.h < vy || b.x > vx + vw || b.y > vy + vh) continue;
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(b.x + 6, b.y + 8, b.w, b.h);
    ctx.fillStyle = b.color; rr(ctx, b.x, b.y, b.w, b.h, 5); ctx.fill();
    ctx.strokeStyle = 'rgba(90,50,20,0.5)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    const cols = Math.max(2, Math.floor(b.w / 34));
    for (let i = 0; i < cols; i++) ctx.fillRect(b.x + 10 + i * 32, b.y + 12, 16, 10);
    if (b.w > 92) { ctx.fillStyle = '#3b2f2f'; ctx.font = 'bold 12px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(b.name, b.x + b.w / 2, b.y + b.h - 10); }
  }
  for (const c of state.world.crates) { ctx.fillStyle = c.color; ctx.fillRect(c.x, c.y, c.w, c.h); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.strokeRect(c.x, c.y, c.w, c.h); }
  for (const boat of state.world.boats) {
    ctx.save(); ctx.translate(boat.x, boat.y); ctx.rotate(boat.a);
    ctx.fillStyle = '#f8fafc'; ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(8, -9); ctx.lineTo(22, 0); ctx.lineTo(8, 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#d94f4f'; ctx.fillRect(-4, -3, 10, 6); ctx.restore();
  }
  for (const t of state.world.trees) {
    if (t.x < vx || t.x > vx + vw || t.y < vy || t.y > vy + vh) continue;
    ctx.fillStyle = '#8a5a2b'; ctx.fillRect(t.x - 2, t.y, 4, 9);
    ctx.fillStyle = t.palm ? '#2f9e44' : '#22863a'; ctx.beginPath(); ctx.arc(t.x, t.y - 3, t.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.arc(t.x - 3, t.y - 6, t.r * 0.45, 0, Math.PI * 2); ctx.fill();
  }
  for (const l of state.world.lamps) { ctx.fillStyle = '#fbbf24'; ctx.beginPath(); ctx.arc(l.x, l.y, 3, 0, Math.PI * 2); ctx.fill(); }
  // Mission marker beam.
  const marker = state.marker;
  if (marker && state.mode === 'play') {
    const pulse = 1 + Math.sin(state.time * 4) * 0.15;
    ctx.fillStyle = marker.color + '33'; ctx.beginPath(); ctx.arc(marker.x, marker.y, 44 * pulse, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = marker.color; ctx.beginPath(); ctx.arc(marker.x, marker.y, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111827'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', marker.x, marker.y + 5);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px sans-serif'; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 3;
    ctx.strokeText(marker.label, marker.x, marker.y - 26); ctx.fillText(marker.label, marker.x, marker.y - 26);
  }
  // Pickups, cars, people.
  for (const pk of state.pickups) { ctx.fillStyle = '#22c55e'; rr(ctx, pk.x - 8, pk.y - 6 + Math.sin(state.time * 5 + pk.x) * 2, 16, 12, 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold 9px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('$', pk.x, pk.y + 4); }
  for (const car of state.allCars) if (car !== state.player.car) drawCar(ctx, car, state.time);
  for (const car of state.policeCars) drawCar(ctx, car, state.time);
  for (const p of state.peds) if (!p.dead) drawPerson(ctx, p, false, state.time);
  for (const c of state.cops) if (!c.dead) drawPerson(ctx, { ...c, color: '#1d4ed8' }, false, state.time);
  if (state.player.car) drawCar(ctx, state.player.car, state.time);
  else drawPerson(ctx, state.player, true, state.time);
  // Shot tracer + muzzle.
  if (state.shotFx) { ctx.strokeStyle = 'rgba(255,220,120,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(state.shotFx.x1, state.shotFx.y1); ctx.lineTo(state.shotFx.x2, state.shotFx.y2); ctx.stroke(); }
  ctx.restore();
  drawHud(state);
  if (state.mode === 'title') drawTitle(state);
  else if (state.mode === 'paused') drawPanel(state, 'PAUSED', ['Porto Sol menunggu.', 'P / Esc untuk lanjut — jalanan tidak ke mana-mana.'], 'P untuk lanjut');
  else if (state.mode === 'over') drawPanel(state, state.overReason === 'busted' ? 'BUSTED' : 'WASTED', [state.overReason === 'busted' ? 'Polisi menahanmu terlalu lama saat kau berhenti.' : 'HP-mu habis di jalanan Porto Sol.', `Uang terakhir: $${state.player.money}`], 'Enter untuk coba lagi');
  else if (state.mode === 'won') drawPanel(state, 'PORTO SOL TAMAT', ['Empat pekerjaan Mara selesai. Kota pelabuhan ini sekarang', 'mengenal namamu — dan polisi juga, jadi hati-hati.', `Uang akhir: $${state.player.money}`], 'Enter untuk free roam');
}

function drawHud(state) {
  const ctx = state.ctx;
  const p = state.player;
  ctx.fillStyle = 'rgba(10,14,20,0.72)'; rr(ctx, 14, 14, 300, 86, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 15px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('HP', 26, 38);
  ctx.fillStyle = '#3f1d1d'; ctx.fillRect(58, 26, 180, 15);
  ctx.fillStyle = p.hp > 30 ? '#22c55e' : '#ef4444'; ctx.fillRect(58, 26, 180 * Math.max(0, p.hp) / 100, 15);
  ctx.fillStyle = '#ffd21f'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(`$${p.money}`, 26, 68);
  ctx.fillStyle = '#cbd5e1'; ctx.font = '13px sans-serif';
  ctx.fillText(p.car ? 'Di dalam mobil — E keluar' : 'Jalan kaki — E masuk mobil dekat', 110, 66);
  ctx.fillText(`Pistol: ${state.combat.ammo}/${state.combat.reserve}${state.combat.reloading > 0 ? ' (reload…)' : ''}  R reload`, 26, 92);
  // Wanted stars.
  ctx.font = '24px sans-serif'; ctx.textAlign = 'right';
  for (let i = 0; i < 5; i++) { ctx.fillStyle = i < Math.floor(state.wanted) ? '#ffd21f' : 'rgba(255,255,255,0.25)'; ctx.fillText('★', VIEW_W - 18 - (4 - i) * 28, 42); }
  if (state.bust > 0) { ctx.fillStyle = 'rgba(10,14,20,0.7)'; ctx.fillRect(VIEW_W - 190, 52, 172, 16); ctx.fillStyle = '#ef4444'; ctx.fillRect(VIEW_W - 188, 54, 168 * state.bust, 12); ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('BUSTED?', VIEW_W - 104, 64); }
  // Objective + banner.
  ctx.textAlign = 'center';
  if (state.banner && state.banner.t > 0) {
    ctx.fillStyle = 'rgba(10,14,20,0.78)'; rr(ctx, VIEW_W / 2 - 390, VIEW_H - 118, 780, 44, 9); ctx.fill();
    ctx.fillStyle = '#fde68a'; ctx.font = '14px sans-serif';
    const txt = state.banner.text.length > 108 ? state.banner.text.slice(0, 108) + '…' : state.banner.text;
    ctx.fillText(txt, VIEW_W / 2, VIEW_H - 90);
  }
  ctx.fillStyle = 'rgba(10,14,20,0.66)'; rr(ctx, VIEW_W / 2 - 390, VIEW_H - 66, 780, 40, 9); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 14px sans-serif'; ctx.fillText(state.objective || '', VIEW_W / 2, VIEW_H - 40);
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '12px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('WASD/panah gerak · E mobil · mouse aim, klik tembak · Spasi pukul · P pause', 16, VIEW_H - 12);
  drawMinimap(state);
}

function drawMinimap(state) {
  const ctx = state.ctx;
  const mw = 190, mh = 142, mx = VIEW_W - mw - 14, my = VIEW_H - mh - 14;
  const sx = mw / WORLD_W, sy = mh / WORLD_H;
  ctx.fillStyle = 'rgba(16,24,32,0.88)'; rr(ctx, mx, my, mw, mh, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke();
  ctx.fillStyle = '#2e9db8'; ctx.fillRect(mx, my + 2280 * sy, mw, 120 * sy); ctx.fillRect(mx + 3080 * sx, my, 120 * sx, mh);
  ctx.strokeStyle = '#8b93a3'; ctx.lineWidth = 1;
  for (const rx of ROAD_X) { ctx.beginPath(); ctx.moveTo(mx + rx * sx, my); ctx.lineTo(mx + rx * sx, my + mh); ctx.stroke(); }
  for (const ry of ROAD_Y) { ctx.beginPath(); ctx.moveTo(mx, my + ry * sy); ctx.lineTo(mx + mw, my + ry * sy); ctx.stroke(); }
  ctx.fillStyle = '#f2e3c6'; ctx.fillRect(mx + BANK.x * sx - 3, my + BANK.y * sy - 3, 6, 6);
  const dot = (x, y, color, r = 3) => { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(mx + x * sx, my + y * sy, r, 0, Math.PI * 2); ctx.fill(); };
  for (const c of state.policeCars) dot(c.x, c.y, '#60a5fa');
  for (const c of state.cops) dot(c.x, c.y, '#60a5fa', 2);
  if (state.marker) dot(state.marker.x, state.marker.y, state.marker.color, 4);
  const pp = state.player.car || state.player;
  dot(pp.x, pp.y, '#ffffff', 4);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 10px sans-serif'; ctx.textAlign = 'left'; ctx.fillText('PORTO SOL', mx + 8, my + 14);
}

function drawPanel(state, title, lines, prompt) {
  const ctx = state.ctx;
  ctx.fillStyle = 'rgba(8,10,16,0.72)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#17202b'; rr(ctx, VIEW_W / 2 - 330, 218, 660, 330, 16); ctx.fill();
  ctx.strokeStyle = '#e8a13a'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#ffd21f'; ctx.font = 'bold 44px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(title, VIEW_W / 2, 300);
  ctx.fillStyle = '#e5e7eb'; ctx.font = '17px sans-serif';
  lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 356 + i * 28));
  ctx.fillStyle = '#4ade80'; ctx.font = 'bold 18px sans-serif'; ctx.fillText(prompt, VIEW_W / 2, 512);
}

function drawTitle(state) {
  const ctx = state.ctx;
  ctx.fillStyle = 'rgba(8,12,20,0.55)'; ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd21f'; ctx.font = 'bold 84px sans-serif'; ctx.fillText('PORTO SOL', VIEW_W / 2, 190);
  ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif';
  ctx.fillText('Kota pelabuhan yang cerah di siang hari — dan sangat sibuk di malam hari.', VIEW_W / 2, 246);
  ctx.fillText('Mara, seorang fixer dermaga, punya empat pekerjaan untuk orang yang', VIEW_W / 2, 282);
  ctx.fillText('tidak banyak bertanya. Curi, antar, kabur, dan rampok Bank Sol.', VIEW_W / 2, 310);
  ctx.fillStyle = '#17202b'; rr(ctx, VIEW_W / 2 - 320, 348, 640, 178, 14); ctx.fill();
  ctx.fillStyle = '#e5e7eb'; ctx.font = '16px sans-serif';
  const lines = ['WASD / panah — bergerak & menyetir', 'E — masuk / keluar mobil    Enter — mulai misi di penanda', 'Mouse — bidik, klik — tembak, Spasi — pukul, R — reload', 'P / Esc — pause    Hindari polisi saat wanted naik!'];
  lines.forEach((l, i) => ctx.fillText(l, VIEW_W / 2, 388 + i * 32));
  ctx.fillStyle = '#4ade80'; ctx.font = 'bold 24px sans-serif';
  ctx.fillText(state.hasSave ? 'Tekan Enter — lanjutkan permainan tersimpan' : 'Tekan Enter — mulai', VIEW_W / 2, 590);
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.font = '13px sans-serif';
  ctx.fillText('Game orisinal: semua nama, karakter, dan cerita di Porto Sol adalah karangan.', VIEW_W / 2, 640);
}
