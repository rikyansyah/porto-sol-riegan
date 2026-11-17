// Misi dan cerita Porto Sol — empat misi berurutan dari fixer Mara.
// 1 curi mobil & antar ke bengkel, 2 kabur dari razia, 3 ambil tiga paket,
// 4 rampok Bank Sol lalu kabur ke dermaga. Hadiah cash tiap misi selesai.
import { MISSIONS, HIDEOUT, BANK } from './config.js';
import { dist } from './world.js';
import { raiseWanted } from './police.js';

const PACKAGES = [
  { x: 300, y: 600, label: 'Paket Pantai' },
  { x: 1800, y: 600, label: 'Paket Pasar' },
  { x: 2600, y: 2000, label: 'Paket Pelabuhan' },
];
const GARAGE = { x: 2600, y: 200 };
const DOCK = { x: 2800, y: 2250 };

function setMarker(state, x, y, text) {
  state.mission.marker = { x, y };
  state.mission.text = text;
}

function completeMission(state) {
  const m = MISSIONS[state.mission.index];
  state.cash += m.reward;
  state.message = `Misi selesai: ${m.title} — +$${m.reward}. Mara: "Bagus. Lanjut."`;
  state.messageTimer = 5;
  state.mission.index += 1;
  state.mission.stage = 0;
  state.mission.timer = 0;
  if (state.mission.index >= MISSIONS.length) {
    state.mission.done = true;
    state.mission.text = 'Semua misi selesai! Kamu legenda Porto Sol.';
    state.mission.marker = null;
    state.message = 'KAMU MENANG! Semua misi Mara selesai. Porto Sol milikmu.';
    state.messageTimer = 8;
    return true;
  }
  const next = MISSIONS[state.mission.index];
  state.mission.text = next.brief;
  return true;
}

export function updateMissions(state, dt) {
  const m = state.mission;
  if (m.done) return false;
  const p = state.player;
  switch (m.index) {
    case 0: {
      if (m.stage === 0) {
        setMarker(state, 600, 2150, 'Curi sedan kuning di pelabuhan (dekati, tekan E)');
        if (p.inCar && p.car && p.car.color === '#f2b705') { m.stage = 1; }
      } else {
        setMarker(state, GARAGE.x, GARAGE.y, 'Antar sedan kuning ke bengkel Rico di utara');
        if (p.inCar && dist(p.x, p.y, GARAGE.x, GARAGE.y) < 90) return completeMission(state);
      }
      break;
    }
    case 1: {
      if (m.stage === 0) {
        raiseWanted(state, 3);
        m.stage = 1; m.timer = 25;
        state.message = 'Razia! Kabur ke tempat persembunyian di taman (lingkaran hijau).';
        state.messageTimer = 5;
      }
      setMarker(state, HIDEOUT.x, HIDEOUT.y, `Bersembunyi di taman sampai panas reda (${Math.ceil(m.timer)} dtk)`);
      m.timer -= dt;
      if (dist(p.x, p.y, HIDEOUT.x, HIDEOUT.y) < HIDEOUT.r && state.wanted <= 1) return completeMission(state);
      if (m.timer <= 0) { state.wanted = 0; state.wantedHeat = 0; return completeMission(state); }
      break;
    }
    case 2: {
      const left = PACKAGES.filter((_, i) => !m.packages[i]);
      if (left.length === 0) return completeMission(state);
      const nextPkg = left[0];
      setMarker(state, nextPkg.x, nextPkg.y, `Ambil ${nextPkg.label} (${3 - left.length}/3 sudah diambil)`);
      PACKAGES.forEach((pk, i) => {
        if (!m.packages[i] && dist(p.x, p.y, pk.x, pk.y) < 46) {
          m.packages[i] = true;
          state.message = `${pk.label} diambil!`;
          state.messageTimer = 3;
          if (state.wanted < 1) raiseWanted(state, 1);
        }
      });
      break;
    }
    case 3: {
      if (m.stage === 0) {
        setMarker(state, BANK.x, BANK.y, 'Masuk ke Bank Sol dan ambil uangnya');
        if (dist(p.x, p.y, BANK.x, BANK.y) < 80) {
          m.stage = 1; state.cash += 1200;
          raiseWanted(state, 5);
          state.message = 'Uang bank didapat: +$1200! Semua polisi mengejarmu — kabur ke dermaga!';
          state.messageTimer = 6;
      // Penjaga bank muncul saat perampokan dimulai.
          state.enemies.push({ x: BANK.x + 60, y: BANK.y + 40, hp: 50, angle: 0, speed: 80, guard: true, cool: 0 });
          state.enemies.push({ x: BANK.x - 60, y: BANK.y + 60, hp: 50, angle: 0, speed: 80, guard: true, cool: 0 });
        }
      } else {
        setMarker(state, DOCK.x, DOCK.y, 'Kabur ke dermaga selatan — jangan tertangkap!');
        if (dist(p.x, p.y, DOCK.x, DOCK.y) < 100) {
          state.wanted = 0;
          return completeMission(state);
        }
      }
      break;
    }
    default: break;
  }
  return false;
}
export { PACKAGES, GARAGE, DOCK };
