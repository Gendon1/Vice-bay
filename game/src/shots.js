// Vice Bay v1.3: deterministic title, gameplay, and game-over screenshot scenes.
// The screenshot scenes behind ?shot=start|play|end. Each one stages the
// real world for a fixed number of steps, so the frame is what a short
// game really looks like and the same seed always gives the same frame.
import { MISSIONS, STEP } from './config.js';
import { EVENT_OVER } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_SECONDS = 5;
const PLAY_SECONDS = 20;
const END_LIMIT_SECONDS = 60;

// v1.3 staged-scene polish keeps screenshot runs seeded and repeatable.

/** Drive toward the active mission marker, on foot or in a car. */
function autopilot(state) {
  const m = state.missionIndex < MISSIONS.length ? MISSIONS[state.missionIndex] : null;
  if (!m) return { x: 0, y: 0, enter: false, shoot: false };
  const dx = m.x - state.player.x;
  const dy = m.y - state.player.y;
  const len = Math.hypot(dx, dy) || 1;
  const input = { x: dx / len, y: dy / len, enter: false, shoot: false };
  // In a car, up is forward: map the direction into the car's local frame.
  if (state.player.inCar) {
    const a = state.player.angle;
    const forward = Math.cos(a) * input.x + Math.sin(a) * input.y;
    const side = -Math.sin(a) * input.x + Math.cos(a) * input.y;
    input.x = side;
    input.y = -forward;
  }
  return input;
}

/**
 * Stage the title, wanted getaway, or busted scene (unknown names use title)
 * and return its screen plus the best money to show.
 */
export function stageShot(name, world) {
  world.reset();
  if (name !== 'play' && name !== 'end') {
    for (let index = 0; index < START_SECONDS / STEP; index += 1) world.step(STEP, { x: 0, y: 0, enter: false, shoot: false }, true);
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'end') {
    // Game-over scene: low health, maximum wanted heat, and the final objective.
    world.state.player.health = 15;
    world.state.wanted = 4;
    world.state.missionIndex = 2;
    world.state.missionText = MISSIONS[2].text;
    for (let index = 0; index < END_LIMIT_SECONDS / STEP; index += 1) {
      if (world.step(STEP, autopilot(world.state), false) & EVENT_OVER) break;
    }
    return { screen: SCREEN_OVER, best: world.state.money };
  }
  // Getaway scene: start in a parked car with wanted heat and the Pickup objective.
  const near = world.state.cars[0];
  if (near) {
    world.state.player.x = near.x;
    world.state.player.y = near.y;
    world.step(STEP, { x: 0, y: 0, enter: true, shoot: false }, false);
  }
  world.state.wanted = 2;
  world.state.wantedTimer = 0;
  world.state.player.health = 100;
  world.state.missionIndex = 1;
  world.state.missionText = MISSIONS[1].text;
  for (let index = 0; index < PLAY_SECONDS / STEP; index += 1) {
    if (world.step(STEP, autopilot(world.state), false) & EVENT_OVER) break;
  }
  const over = world.state.player.health <= 0;
  return { screen: over ? SCREEN_OVER : SCREEN_PLAY, best: world.state.money };
}
