// Porto Sol — konfigurasi dunia dan aturan main.
// Kota fiksi orisinal "Porto Sol": kota pelabuhan yang disinari matahari,
// jalan grid, pantai di barat, pelabuhan di selatan, taman di tengah.
export const STEP = 1 / 60;
export const WORLD = { width: 3200, height: 2400 };
export const VIEW = { width: 1280, height: 800 };
export const SAVE_KEY = 'porto-sol-save-v1';
export const BEST_KEY = 'porto-sol-best-cash-v1';

// Jalan grid: jarak antar jalan dan lebar jalan (termasuk trotoar).
export const ROAD = { spacing: 400, width: 96, lane: 26 };
export const ROAD_X = [200, 600, 1000, 1400, 1800, 2200, 2600, 3000];
export const ROAD_Y = [200, 600, 1000, 1400, 1800, 2200];

export const PLAYER = { radius: 14, walkSpeed: 185, runSpeed: 250, hp: 100 };
export const CAR = { length: 54, width: 26, accel: 260, brake: 420, maxSpeed: 460, maxReverse: 150, turn: 2.6, grip: 3.2 };
export const POLICE = { maxSpeed: 430, accel: 300, countFor: [0, 1, 2, 3, 4, 5] };

// Warna kota: palet hangat khas Porto Sol (kuning matahari, laut biru, atap terakota).
export const COLORS = {
  grass: '#7ec850', parkGrass: '#69b844', sand: '#f2d8a0', sea: '#2f9fd8',
  road: '#3c4148', roadLine: '#f5d76e', sidewalk: '#b9b3a4',
  building: ['#e86a5a', '#f2a541', '#5ab0e6', '#8f7fd4', '#e88bb0', '#63c7a5', '#f5e05a', '#d96a3b'],
  roof: ['#c94f43', '#d98a2b', '#3f7fb8', '#6d5aa8', '#c96a92', '#4a9e82'],
};
export const CAR_COLORS = ['#e8452c', '#f2b705', '#2f80ed', '#27ae60', '#9b51e0', '#f2f2f2', '#222831', '#ff7a59', '#00b8a9'];
// Sedan kuning misi 1 selalu memakai warna ini agar mudah dikenali pemain.
export const TARGET_CAR_COLOR = '#f2b705';

// Kontak cerita: Mara, fixer pelabuhan Porto Sol.
export const FIXER = 'Mara';
export const MISSIONS = [
  { id: 1, title: 'Mobil Pertama', brief: 'Mara: "Curi sedan kuning di dekat pelabuhan, antar ke bengkel Rico di utara."', reward: 400 },
  { id: 2, title: 'Kabur dari Razia', brief: 'Mara: "Polisi mengendusmu. Kabur dan sembunyi di tempat persembunyian taman sampai panas reda."', reward: 600 },
  { id: 3, title: 'Tiga Paket', brief: 'Mara: "Ambil tiga paket di penjuru kota: pantai, pasar, dan pelabuhan. Jangan menarik perhatian."', reward: 900 },
  { id: 4, title: 'Perampokan Bank Sol', brief: 'Mara: "Ini yang terakhir: rampok Bank Sol, lalu kabur ke dermaga. Semua polisi kota akan mengejarmu."', reward: 2500 },
];
export const HIDEOUT = { x: 1200, y: 1200, r: 90 };
export const BANK = { x: 1400, y: 600 };
export const HARBOR_DROP = { x: 2600, y: 2200 };
