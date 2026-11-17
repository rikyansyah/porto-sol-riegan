// Lalu lintas Porto Sol: mobil AI mengikuti jalan grid dan pejalan kaki
// berjalan di trotoar, berhenti di persimpangan, lalu memilih arah baru.
import { ROAD_X, ROAD_Y } from './config.js';
import { nearestRoadX, nearestRoadY, dist } from './world.js';

export function updateTraffic(state, dt) {
  for (const car of state.cars) {
    if (!car.ai || car.police) continue;
    // Di persimpangan, kadang belok; kalau tidak, lurus mengikuti jalan.
    const nearX = ROAD_X.some((rx) => Math.abs(car.x - rx) < 30);
    const nearY = ROAD_Y.some((ry) => Math.abs(car.y - ry) < 30);
    if (nearX && nearY && Math.random() < dt * 0.6) {
      const vertical = Math.random() < 0.5;
      car.angle = vertical ? (Math.random() < 0.5 ? Math.PI / 2 : -Math.PI / 2) : (Math.random() < 0.5 ? 0 : Math.PI);
    }
    // Perlambat bila ada mobil di depan.
    let slow = false;
    for (const o of state.cars) {
      if (o === car) continue;
      const dx = o.x - car.x, dy = o.y - car.y;
      const ahead = dx * Math.cos(car.angle) + dy * Math.sin(car.angle);
      if (ahead > 0 && ahead < 70 && Math.abs(dx * Math.sin(car.angle) - dy * Math.cos(car.angle)) < 26) slow = true;
    }
    const target = slow ? 0 : 120;
    car.speed += (target - car.speed) * Math.min(1, dt * 1.5);
    car.x += Math.cos(car.angle) * car.speed * dt;
    car.y += Math.sin(car.angle) * car.speed * dt;
    // Pantul di tepi kota: putar balik di ujung jalan.
    if (car.x < 150 || car.x > 3050 || car.y < 150 || car.y > 2250) car.angle += Math.PI;
    // Jaga tetap di jalan: tarik pelan ke garis jalan terdekat.
    if (Math.abs(Math.sin(car.angle)) > 0.7) {
      const rx = nearestRoadX(car.x);
      car.x += (rx - car.x) * Math.min(1, dt * 0.8);
    } else {
      const ry = nearestRoadY(car.y);
      car.y += (ry - car.y) * Math.min(1, dt * 0.8);
    }
  }
  // Pejalan kaki: jalan di trotoar, ganti tujuan bila sampai.
  for (const ped of state.peds) {
    if (ped.wait > 0) { ped.wait -= dt; continue; }
    if (ped.tx === 0 && ped.ty === 0) {
      const rx = ROAD_X[Math.floor(Math.random() * ROAD_X.length)];
      const ry = ROAD_Y[Math.floor(Math.random() * ROAD_Y.length)];
      if (Math.random() < 0.5) { ped.tx = rx + (Math.random() < 0.5 ? 62 : -62); ped.ty = ped.y; }
      else { ped.tx = ped.x; ped.ty = ry + (Math.random() < 0.5 ? 62 : -62); }
    }
    const dx = ped.tx - ped.x, dy = ped.ty - ped.y, d = Math.hypot(dx, dy);
    if (d < 12) { ped.tx = 0; ped.ty = 0; ped.wait = Math.random() * 2; continue; }
    ped.angle = Math.atan2(dy, dx);
    ped.x += (dx / d) * ped.speed * dt;
    ped.y += (dy / d) * ped.speed * dt;
    // Pejalan kaki panik dan lari bila pemain menabrak / menembak dekat mereka.
    const pp = state.player;
    if (dist(ped.x, ped.y, pp.x, pp.y) < 46) {
      ped.x += (ped.x - pp.x) * dt * 3; ped.y += (ped.y - pp.y) * dt * 3;
    }
  }
}
