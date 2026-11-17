// Input keyboard + mouse untuk Porto Sol.
// WASD jalan / nyetir, E masuk-keluar mobil, Spasi rem tangan,
// klik kiri pukul atau tembak (pistol bila ada amunisi), P/Esc pause,
// Enter mulai / lanjut. Mouse juga mengarahkan bidikan.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER_CAR = 4;
export const ACTION_SHOOT = 8;
export const ACTION_MELEE = 16;

export function createInput(canvas) {
  const keys = new Set();
  const mouse = { x: 0, y: 0, down: false, clicked: false };
  let actions = 0;
  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'run', ShiftRight: 'run', Space: 'handbrake',
  };
  function onKeyDown(e) {
    if (e.code === 'Enter' || e.code === 'Space') actions |= ACTION_CONFIRM;
    if (e.code === 'KeyP' || e.code === 'Escape') actions |= ACTION_PAUSE;
    if (e.code === 'KeyE') actions |= ACTION_ENTER_CAR;
    if (KEYMAP[e.code]) keys.add(KEYMAP[e.code]);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  }
  function onKeyUp(e) { if (KEYMAP[e.code]) keys.delete(KEYMAP[e.code]); }
  function onMouseMove(e) {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  }
  function onMouseDown(e) {
    if (e.button !== 0) return;
    mouse.down = true; mouse.clicked = true; onMouseMove(e);
    // Klik juga membangunkan audio (gestur pengguna) lewat ACTION_SHOOT.
    actions |= ACTION_SHOOT;
  }
  function onMouseUp(e) { if (e.button === 0) mouse.down = false; }
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);
  return {
    keys, mouse,
    takeActions() { const a = actions; actions = 0; const c = mouse.clicked; mouse.clicked = false; return { flags: a, clicked: c }; },
    axis() {
      let x = 0, y = 0;
      if (keys.has('left')) x -= 1;
      if (keys.has('right')) x += 1;
      if (keys.has('up')) y -= 1;
      if (keys.has('down')) y += 1;
      return { x, y, run: keys.has('run'), handbrake: keys.has('handbrake') };
    },
  };
}
