// Vice Bay v1.3: gameplay configuration, tuning values, and shared constants.
// Every tuning number and colour in one place. The viewport is a fixed
// 1280x720 logical area; the world is larger (2400x1800) and the camera
// follows the player, so no rule below depends on the screen size.

export const VERSION = '1.3';

export const FIELD = { width: 1280, height: 720, groundY: 664 };

export const WORLD = { width: 2400, height: 1800 };

/** The simulation's fixed step, in seconds: 60 updates a second. */
export const STEP = 1 / 60;

export const PLAYER = {
  width: 28,
  height: 28,
  speed: 230,
  invulnerable: 1.5,
  health: 100,
};

export const CAR = {
  width: 56,
  height: 28,
  accel: 420,
  maxSpeed: 430,
  maxReverse: 160,
  turn: 2.6,
};

export const LIVES = 3;

export const LEVEL = { seconds: 12, max: 12 };

export const POOL_SIZE = 64;

export const TRAFFIC_COUNT = 10;
export const PED_COUNT = 14;
export const PARKED_COUNT = 8;
export const PICKUP_COUNT = 6;
export const BULLET_COUNT = 32;

export const MISSIONS = [
  { name: 'Getaway', text: 'Drive to the north docks', x: 1200, y: 150, reward: 200, color: '#ffd23f' },
  { name: 'Pickup', text: 'On foot: reach the park drop', x: 450, y: 1050, reward: 150, color: '#3ddc84' },
  { name: 'Lose the cops', text: 'Reach the blue hideout', x: 2100, y: 1500, reward: 300, color: '#4fc3f7' },
];

export const PALETTE = {
  backdrop: '#0e1420',
  sky: '#87bfe8',
  grass: '#6faf4e',
  park: '#4e9a3d',
  road: '#3a3f4a',
  roadLine: '#f2c94c',
  sidewalk: '#c9c2b4',
  building: '#d98a5f',
  building2: '#7a8ba0',
  building3: '#e8b04b',
  water: '#2f8fd0',
  sand: '#f0d9a0',
  player: '#ff5a5a',
  playerCar: '#e53935',
  traffic: '#4fc3f7',
  police: '#1c2733',
  ped: '#f5e6c8',
  coin: '#f2c94c',
  panel: '#101820',
  text: '#eef1f5',
  muted: '#aab4c0',
  minimap: '#101820',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

/** Where the best money is kept between visits (this browser only). */
export const BEST_KEY = 'vice-bay.best';
