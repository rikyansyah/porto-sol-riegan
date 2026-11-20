// localStorage save: position, money, mission progress, wanted-free state.
import { SAVE_KEY } from './config.js';
export function saveGame(data) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v: 1, ...data })); } catch { /* private mode */ }
}
export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return d && d.v === 1 ? d : null;
  } catch { return null; }
}
export function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch { /* ignore */ } }
