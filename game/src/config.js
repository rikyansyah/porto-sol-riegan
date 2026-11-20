// Porto Sol — world constants. All tuning lives here so the rest of the
// game reads like a story instead of a pile of magic numbers.
export const WORLD_W = 3200;
export const WORLD_H = 2400;
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const STEP = 1 / 60;
export const ROAD_SPACING = 400;
export const ROAD_W = 96;
export const ROAD_X = [200, 600, 1000, 1400, 1800, 2200, 2600, 3000];
export const ROAD_Y = [200, 600, 1000, 1400, 1800, 2200];
export const HIDEOUT = { x: 1200, y: 1200 };
export const BANK = { x: 1400, y: 600 };
export const HARBOR_DROP = { x: 2600, y: 2200 };
export const MARKET = { x: 1000, y: 1000 };
export const BEACH = { x: 2800, y: 1400 };
export const RICO_GARAGE = { x: 600, y: 1800 };
export const MARA_SPOT = { x: 800, y: 800 };
export const PALETTE = {
  sand: '#f2d492', water: '#2e9db8', waterDeep: '#1f7f9c',
  grass: '#7ec850', park: '#5db84a', road: '#3d3d44', roadLine: '#f7e08a',
  sidewalk: '#d9c9a8', roofA: '#e2703a', roofB: '#e8a13a', roofC: '#d94f4f',
  roofD: '#f2e3c6', roofE: '#8ecae6', wall: '#fff3d6',
};
export const PLAYER = { speed: 165, radius: 13, hp: 100 };
export const CAR = { accel: 260, brake: 340, maxSpeed: 330, reverse: 120, turn: 2.4, radius: 20 };
export const POLICE = { speed: 300, footSpeed: 150, bustTime: 2.2 };
export const SAVE_KEY = 'porto-sol-save-v1';
