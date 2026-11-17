// Screenshot scenes Porto Sol (?shot=start|chase|mission|heist).
// Tiap scene memainkan aturan nyata dari dunia segar dengan autopilot
// (bukan mockup): supir otomatis mengikuti jalan, pejalan kaki berjalan,
// polisi mengejar, lalu frame yang sama selalu terulang dari seed tetap.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const SAMPLE = STEP;

function fakeInput(axisFn) {
  return { axis: axisFn, takeActions() { return { flags: 0, clicked: false }; } };
}
function stillInput() { return fakeInput(() => ({ x: 0, y: 0, run: false, handbrake: false })); }
function driveInput(state) {
  return fakeInput(() => {
    const car = state.player.car;
    if (!car) return { x: 0, y: 0, run: false, handbrake: false };
    // Bidik persimpangan berikutnya di depan: belok mengikuti grid jalan.
    const ahead = 320;
    const tx = car.x + Math.cos(car.angle) * ahead;
    const ty = car.y + Math.sin(car.angle) * ahead;
    let want = Math.atan2(ty - car.y, tx - car.x);
    // Di dekat persimpangan, pilih jalan lurus atau belok secara berkala
    // agar mobil tidak menabrak blok bangunan di ujung jalan.
    const t = state.time;
    const turn = Math.sin(t * 0.35) > 0.55 ? Math.PI / 2 : 0;
    want = car.angle + turn * 0.4;
    let diff = want - car.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return { x: diff > 0.12 ? 1 : diff < -0.12 ? -1 : 0, y: -1, run: false, handbrake: false };
  });
}
function walkToInput(state, tx, ty) {
  return fakeInput(() => {
    const p = state.player;
    const dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy) || 1;
    if (d < 20) return { x: 0, y: 0, run: false, handbrake: false };
    return { x: dx / d, y: dy / d, run: false, handbrake: false };
  });
}

export function stageShot(name, world) {
  const state = world.state;
  world.reset();
  if (name === 'chase') {
    // Duduk di sedan kuning, wanted 3, polisi mengejar, nyetir 9 detik.
    const car = state.cars[0];
    state.player.inCar = true; state.player.car = car; car.parked = false;
    state.player.x = car.x; state.player.y = car.y;
    state.wanted = 3; state.wantedHeat = 60;
    state.mission.index = 1; state.mission.stage = 1; state.mission.timer = 25;
    state.mission.text = 'Kabur dari razia! Bersembunyi di taman sampai panas reda.';
    state.mission.marker = { x: 1200, y: 1200 };
    for (let i = 0; i < 9 / SAMPLE; i++) world.step(SAMPLE, driveInput(state), {});
    return { screen: SCREEN_PLAY, best: 400 };
  }
  if (name === 'mission') {
    // Jalan kaki menuju paket pantai, misi 3, wanted 1, NPC di sekitar.
    state.mission.index = 2; state.mission.stage = 0;
    state.mission.text = 'Ambil Paket Pantai di tepi laut Porto Sol.';
    state.mission.marker = { x: 300, y: 600 };
    state.player.x = 420; state.player.y = 700;
    state.wanted = 1; state.wantedHeat = 40;
    state.cash = 1000;
    for (let i = 0; i < 7 / SAMPLE; i++) world.step(SAMPLE, walkToInput(state, 300, 600), {});
    return { screen: SCREEN_PLAY, best: 1000 };
  }
  if (name === 'heist') {
    // Misi akhir: uang bank didapat, wanted 5, kabur naik mobil ke dermaga.
    state.mission.index = 3; state.mission.stage = 1;
    state.mission.text = 'Kabur ke dermaga selatan — jangan tertangkap!';
    state.mission.marker = { x: 2800, y: 2250 };
    state.cash = 3700; state.wanted = 5; state.wantedHeat = 60;
    const car = state.cars[3];
    state.player.inCar = true; state.player.car = car; car.parked = false;
    car.x = 1500; car.y = 700; car.angle = Math.PI / 2;
    state.player.x = car.x; state.player.y = car.y;
    state.enemies.push({ x: 1400, y: 660, hp: 50, angle: 0, speed: 80, guard: true, cool: 0 });
    for (let i = 0; i < 7 / SAMPLE; i++) world.step(SAMPLE, driveInput(state), {});
    return { screen: SCREEN_PLAY, best: 3700 };
  }
  // start: layar judul di atas kota yang hidup 5 detik.
  for (let i = 0; i < 5 / SAMPLE; i++) world.step(SAMPLE, stillInput(), {});
  return { screen: SCREEN_TITLE, best: 0 };
}
