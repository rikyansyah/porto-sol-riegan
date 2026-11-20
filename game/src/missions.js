// Mara's four jobs. Each mission is a small state machine: a marker in the
// world, an objective line on the HUD, triggers, a cash reward and a scrap
// of story. Between jobs the player free-roams and the next marker waits.
import { HIDEOUT, BANK, HARBOR_DROP, MARKET, BEACH, RICO_GARAGE, MARA_SPOT } from './config.js';
import { sfx } from './audio.js';

export const MISSIONS = [
  {
    id: 1, title: 'Mobil untuk Rico',
    intro: 'Mara: "Rico butuh sedan kuning di dekat pasar. Ambil, jangan sampai penyok parah, antar ke bengkelnya."',
    reward: 250,
  },
  {
    id: 2, title: 'Razzia di Pasar',
    intro: 'Mara: "Ambil paketku di pasar. Kalau polisi datang — dan mereka akan datang — hilang di taman hideout sampai suasana dingin."',
    reward: 400,
  },
  {
    id: 3, title: 'Tiga Paket',
    intro: 'Mara: "Tiga paket, tiga titik: pantai, pasar, pelabuhan. Urutannya jangan sampai tertukar."',
    reward: 650,
  },
  {
    id: 4, title: 'Bank Sol',
    intro: 'Mara: "Pekerjaan besar. Tahan posisi di brankas Bank Sol, isi tasnya, lalu buang semuanya di titik antar dermaga. Pulang kaya atau tidak pulang."',
    reward: 2500,
  },
];

export function createMissions() {
  return { index: 0, phase: 'offer', step: 0, hold: 0, packages: 0, done: false, active: false };
}

export function currentMarker(state) {
  const m = state.missions;
  if (m.done) return null;
  if (m.phase === 'offer') return { ...MARA_SPOT, label: 'Mara', color: '#f472b6' };
  const job = MISSIONS[m.index];
  if (job.id === 1) {
    if (m.step === 0) { const t = state.allCars.find((c) => c.isTarget); return t ? { x: t.x, y: t.y, label: 'Sedan kuning', color: '#ffd21f' } : null; }
    return { ...RICO_GARAGE, label: 'Bengkel Rico', color: '#38bdf8' };
  }
  if (job.id === 2) {
    if (m.step === 0) return { ...MARKET, label: 'Paket pasar', color: '#ffd21f' };
    return { ...HIDEOUT, label: 'Hideout taman', color: '#4ade80' };
  }
  if (job.id === 3) {
    const pts = [{ ...BEACH, label: 'Paket pantai' }, { ...MARKET, label: 'Paket pasar' }, { x: 2500, y: 2050, label: 'Paket pelabuhan' }];
    return { ...pts[m.step], color: '#ffd21f' };
  }
  if (job.id === 4) {
    if (m.step === 0) return { ...BANK, label: 'Brankas Bank Sol', color: '#ffd21f' };
    return { ...HARBOR_DROP, label: 'Titik antar dermaga', color: '#38bdf8' };
  }
  return null;
}

export function objectiveText(state) {
  const m = state.missions;
  if (m.done) return 'Semua pekerjaan Mara selesai. Porto Sol milikmu — free roam.';
  const job = MISSIONS[m.index];
  if (m.phase === 'offer') return `Temui Mara (penanda merah muda) lalu tekan Enter — Misi ${job.id}: ${job.title}`;
  if (job.id === 1) return m.step === 0 ? 'Curi sedan kuning yang ditandai di dekat pasar (E untuk masuk).' : 'Antar sedan itu ke bengkel Rico.';
  if (job.id === 2) return m.step === 0 ? 'Ambil paket di pasar.' : 'Kabur ke hideout taman dan turunkan wanted ke 0 di sana.';
  if (job.id === 3) return `Ambil paket ${m.step + 1} dari 3 (${['pantai', 'pasar', 'pelabuhan'][m.step]}).`;
  if (job.id === 4) return m.step === 0 ? `Tahan posisi di brankas Bank Sol (${Math.max(0, 4 - m.hold).toFixed(1)} dtk).` : 'Bawa uang rampokan ke titik antar dermaga!';
  return '';
}

function finishMission(state) {
  const job = MISSIONS[state.missions.index];
  state.player.money += job.reward;
  state.banner = { text: `Misi selesai: ${job.title}  +$${job.reward}`, t: 4 };
  sfx.mission(); sfx.cash();
  state.missions.index++;
  state.missions.phase = 'offer'; state.missions.step = 0; state.missions.hold = 0; state.missions.packages = 0;
  if (state.missions.index >= MISSIONS.length) { state.missions.done = true; state.mode = 'won'; }
  state.requestSave();
}

export function updateMissions(state, dt) {
  const m = state.missions;
  if (m.done) return;
  const p = state.player;
  const near = (pt, r) => Math.hypot(p.x - pt.x, p.y - pt.y) < r || (p.car && Math.hypot(p.car.x - pt.x, p.car.y - pt.y) < r);
  if (m.phase === 'offer') {
    if (near(MARA_SPOT, 56) && state.input.hit('Enter')) {
      m.phase = 'active'; m.active = true;
      state.banner = { text: MISSIONS[m.index].intro, t: 6 };
      sfx.mission();
    }
    return;
  }
  const job = MISSIONS[m.index];
  if (job.id === 1) {
    if (m.step === 0 && p.car && p.car.isTarget) m.step = 1;
    else if (m.step === 1 && near(RICO_GARAGE, 95) && p.car && p.car.isTarget) finishMission(state);
  } else if (job.id === 2) {
    if (m.step === 0 && near(MARKET, 60) && !p.car) {
      m.step = 1; state.wanted = Math.max(state.wanted, 2.4); sfx.pickup();
      state.banner = { text: 'Paket diambil — polisi datang! Kabur ke taman!', t: 4 };
    } else if (m.step === 1 && near(HIDEOUT, 120) && state.wanted <= 0.05) finishMission(state);
  } else if (job.id === 3) {
    const pts = [BEACH, MARKET, { x: 2500, y: 2050 }];
    if (near(pts[m.step], 62)) {
      sfx.pickup(); m.packages++; m.step++;
      state.banner = { text: `Paket ${m.packages}/3 terkumpul`, t: 2.5 };
      if (m.step >= 3) finishMission(state);
    }
  } else if (job.id === 4) {
    if (m.step === 0) {
      if (near(BANK, 80) && !p.car) {
        m.hold += dt; state.wanted = Math.min(5, state.wanted + dt * 0.55);
        if (m.hold >= 4) {
          m.step = 1; p.money += 1800; p.bag = true; state.wanted = 4.4;
          state.banner = { text: 'Tas penuh $1800 hasil rampokan! Ke dermaga, sekarang!', t: 4 };
          sfx.cash();
        }
      } else m.hold = Math.max(0, m.hold - dt);
    } else if (near(HARBOR_DROP, 95)) {
      p.bag = false; finishMission(state);
    }
  }
}
