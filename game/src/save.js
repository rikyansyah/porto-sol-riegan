// Save Porto Sol: simpanan localStorage — cash, progresi misi, posisi
// pemain, HP, dan amunisi. Continue memulihkan semuanya di judul.
import { SAVE_KEY } from './config.js';

export function saveGame(state) {
  try {
    const data = {
      cash: state.cash, missionIndex: state.mission.index, missionStage: state.mission.stage,
      packages: state.mission.packages, x: state.player.x, y: state.player.y,
      hp: state.player.hp, ammo: state.player.ammo, carsStolen: state.carsStolen, kills: state.kills,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch { return false; }
}

export function loadGame() {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function applySave(state, data) {
  if (!data) return false;
  state.cash = data.cash || 0;
  // Misi dipulihkan ke awal misi yang sedang berjalan (stage aman).
  state.mission.index = data.missionIndex || 0;
  state.mission.stage = data.missionStage || 0;
  state.mission.packages = data.packages || [false, false, false];
  state.player.x = data.x || 600; state.player.y = data.y || 1400;
  state.player.hp = data.hp || 100; state.player.ammo = data.ammo || 24;
  state.carsStolen = data.carsStolen || 0; state.kills = data.kills || 0;
  state.camera.x = state.player.x; state.camera.y = state.player.y;
  return true;
}
