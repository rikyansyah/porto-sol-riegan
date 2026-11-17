// Porto Sol — boot dan loop utama.
// Layar: judul, main, pause, game over. ?seed=N mengunci dunia;
// ?shot=start|chase|mission|heist menata scene, menggambar 2x, lalu
// menandai window.__shotReady untuk screenshot. Save otomatis tiap
// misi selesai dan tiap 10 detik bermain.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_OVER, EVENT_MISSION } from './world.js';
import { ACTION_CONFIRM, ACTION_PAUSE, ACTION_ENTER_CAR, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createAudio } from './audio.js';
import { saveGame, loadGame, applySave } from './save.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* abaikan */ }
}

function runShot(name) {
  const scene = stageShot(name, world);
  window.__portoSol = world;
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  window.__portoSol = world;
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0, last = performance.now(), saveTimer = 0;

  function announce(message) { status.textContent = message; }
  function startGame(fresh) {
    if (fresh) world.reset();
    accumulator = 0; screen = SCREEN_PLAY;
    audio.unlock();
    announce('Bermain di Porto Sol. Ikuti misi Mara.');
  }
  function continueGame() {
    const data = loadGame();
    if (data) { world.reset(); applySave(world.state, data); screen = SCREEN_PLAY; announce('Lanjutan simpanan dimuat.'); }
    else startGame(true);
  }
  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.cash > best) { best = world.state.cash; saveBest(best); }
    saveGame(world.state);
    announce(world.state.won ? 'Menang! Semua misi selesai.' : `Game over. Cash $${world.state.cash}.`);
  }

  function aimAngle() {
    const m = input.mouse;
    const st = world.state;
    const wx = st.camera.x + (m.x - canvas.width / 2);
    const wy = st.camera.y + (m.y - canvas.height / 2);
    return Math.atan2(wy - st.player.y, wx - st.player.x);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const acts = input.takeActions();
    const flags = acts.flags;
    if (flags & ACTION_CONFIRM && (screen === SCREEN_TITLE || screen === SCREEN_OVER)) startGame(true);
    else if (flags & ACTION_PAUSE && screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Pause.'); }
    else if (flags & (ACTION_PAUSE | ACTION_CONFIRM) && screen === SCREEN_PAUSED) { screen = SCREEN_PLAY; announce('Lanjut.'); }
    // Tombol C di judul = lanjutkan simpanan (ditangani listener keydown
    // di bawah); R di pause = mulai ulang.
    if (screen === SCREEN_PLAY || screen === SCREEN_TITLE) {
      // Aksi sekali-per-frame (masuk mobil / tembak) hanya dipakai pada
      // substep pertama, jangan diulang di substep berikutnya.
      let enterCar = Boolean(flags & ACTION_ENTER_CAR);
      let clicked = acts.clicked;
      while (accumulator >= STEP && (screen === SCREEN_PLAY || screen === SCREEN_TITLE)) {
        const opts = {};
        if (screen === SCREEN_PLAY) {
          opts.enterCar = enterCar; enterCar = false;
          if (clicked) {
            opts.shoot = true; opts.aimAngle = aimAngle(); clicked = false;
            const nearEnemy = world.state.enemies.some((e) => Math.hypot(e.x - world.state.player.x, e.y - world.state.player.y) < 60);
            if (nearEnemy && world.state.player.ammo <= 0) opts.melee = true;
            audio.shot();
          }
          audio.engine(world.state.player.speed, world.state.player.inCar);
          audio.siren(STEP, world.state.wanted);
          saveTimer += STEP;
          if (saveTimer > 10) { saveTimer = 0; saveGame(world.state); }
        }
        const events = world.step(STEP, input, opts);
        if (events & EVENT_MISSION) { audio.mission(); saveGame(world.state); }
        if (events & EVENT_OVER) endGame();
        accumulator -= STEP;
      }
    } else accumulator = 0;
    renderer.draw(world.state, screen, best);
  }

  // Tombol C / R ditangkap di sini agar tidak bentrok dengan input utama.
  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyC' && screen === SCREEN_TITLE) continueGame();
    if (e.code === 'KeyR' && screen === SCREEN_PAUSED) startGame(true);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Pause.'); }
  });
  announce('Porto Sol. Tekan Enter untuk mulai, C untuk lanjutkan simpanan.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
