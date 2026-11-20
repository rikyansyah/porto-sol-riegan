// Deterministic screenshot scenes. ?shot=start|chase|mission|heist with
// ?seed=<n> arranges real game entities, then flags window.__shotReady
// once a frame of the arranged scene has actually been drawn.
export function parseShotParams() {
  const q = new URLSearchParams(location.search);
  const seedRaw = parseInt(q.get('seed') || '1', 10);
  return { shot: q.get('shot') || null, seed: Number.isFinite(seedRaw) ? seedRaw : 1 };
}

export function stageShot(state, name) {
  const p = state.player;
  if (name === 'start') {
    state.mode = 'title';
    p.x = 800; p.y = 860;
  } else if (name === 'chase') {
    state.mode = 'play';
    const car = state.traffic[0] || state.allCars[0];
    if (car) {
      car.x = 1000; car.y = 1000; car.angle = 0; car.parked = false; car.speed = 210;
      p.car = car; car.driver = true; p.x = car.x; p.y = car.y;
      state.traffic = state.traffic.filter((c) => c !== car);
      state.parked = state.parked.filter((c) => c !== car);
    }
    state.wanted = 3;
    state.policeCars.push(
      { x: 850, y: 940, angle: 0.3, speed: 180, color: '#e5e7eb', w: 40, h: 21, hp: 90, isPolice: true, driver: true, parked: false },
      { x: 820, y: 1080, angle: -0.3, speed: 170, color: '#e5e7eb', w: 40, h: 21, hp: 90, isPolice: true, driver: true, parked: false },
    );
    state.banner = { text: 'Polisi mengejar! Wanted ★★★ — jangan sampai tertangkap.', t: 30 };
  } else if (name === 'mission') {
    state.mode = 'play';
    p.x = 800; p.y = 830; p.car = null;
    state.missions.phase = 'offer'; state.missions.index = 0;
  } else if (name === 'heist') {
    state.mode = 'play';
    p.x = 1400; p.y = 700; p.car = null; p.bag = true; p.money = 1800;
    state.wanted = 4;
    state.missions.index = 3; state.missions.phase = 'active'; state.missions.step = 1;
    state.policeCars.push(
      { x: 1230, y: 760, angle: 0.4, speed: 140, color: '#e5e7eb', w: 40, h: 21, hp: 90, isPolice: true, driver: true, parked: false },
      { x: 1580, y: 780, angle: 2.6, speed: 130, color: '#e5e7eb', w: 40, h: 21, hp: 90, isPolice: true, driver: true, parked: false },
    );
    state.cops.push({ x: 1330, y: 770, angle: 0, hp: 40, speed: 150, color: '#1d4ed8', dead: false });
    state.banner = { text: 'Rampokan Bank Sol berhasil — bawa tasnya ke dermaga!', t: 30 };
  }
  // Settle camera on the subject before signalling readiness.
  state.updateCamera(1);
}

export function signalShotReady(state) {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
