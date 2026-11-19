// Vice Bay v1.3: world state, mission progression, and gameplay simulation.
// The game's rules and state, with no drawing and no browser in it.
// Top-down open world: player on foot or in a car, traffic, pedestrians,
// police, wanted level, shooting, cash pickups and 3 missions.
import { BULLET_COUNT, CAR, FIELD, LIVES, MISSIONS, PARKED_COUNT, PED_COUNT, PICKUP_COUNT, PLAYER, TRAFFIC_COUNT, WORLD } from './config.js';

export const KIND_CAR = 0;
export const KIND_PED = 1;
export const KIND_PICKUP = 2;
export const KIND_BLOCK = 3;
export const KIND_COIN = 2;

export const EVENT_HIT = 1;
export const EVENT_COIN = 2;
export const EVENT_OVER = 4;
export const EVENT_MISSION = 8;

const ROAD_W = 70;
const GRID = 300;

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function circleRect(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  return dist2(cx, cy, nx, ny) < r * r;
}

export function createWorld(random) {
  const buildings = [];
  const parks = [];
  const trees = [];
  // City blocks: roads every 300px, buildings inside blocks.
  for (let bx = 0; bx < 8; bx += 1) {
    for (let by = 0; by < 6; by += 1) {
      const x0 = bx * GRID + ROAD_W;
      const y0 = by * GRID + ROAD_W;
      const w = GRID - ROAD_W * 2 + 20;
      const h = GRID - ROAD_W * 2 + 20;
      if (by === 5) continue; // south strip is beach / water, no buildings
       if ((bx === 1 && by === 3) || (bx === 6 && by === 1)) {
         parks.push({ x: x0, y: y0, w, h });
         for (let tree = 0; tree < 18; tree += 1) {
           trees.push({
             x: x0 + 22 + random() * (w - 44),
             y: y0 + 22 + random() * (h - 44),
             size: 10 + random() * 7,
              color: Math.floor(random() * 4),
           });
         }
         continue;
       }
      buildings.push({
        x: x0 + 14 + random() * 20,
        y: y0 + 14 + random() * 20,
        w: w - 40 - random() * 30,
        h: h - 40 - random() * 30,
        color: Math.floor(random() * 6),
        roofColor: Math.floor(random() * 8),
      });
    }
  }
  const roadsV = [];
  const roadsH = [];
  for (let x = GRID; x < WORLD.width; x += GRID) roadsV.push(x);
  for (let y = GRID; y < WORLD.height; y += GRID) roadsH.push(y);

  const player = { x: 1200, y: 900, angle: -Math.PI / 2, speed: 0, inCar: false, carId: -1, health: PLAYER.health, invulnerable: 0 };
  const cars = [];
  for (let i = 0; i < PARKED_COUNT + 8; i += 1) cars.push({ active: true, x: 0, y: 0, angle: 0, speed: 0, color: i % 5, parked: true });
  const traffic = [];
  for (let i = 0; i < TRAFFIC_COUNT; i += 1) traffic.push({ active: true, x: 0, y: 0, angle: 0, speed: 0, color: i % 5 });
  const peds = [];
  for (let i = 0; i < PED_COUNT; i += 1) peds.push({ active: true, x: 0, y: 0, angle: 0, speed: 0, color: i % 4 });
  const police = [];
  for (let i = 0; i < 3; i += 1) police.push({ active: false, x: 0, y: 0, angle: 0, speed: 0 });
  const bullets = [];
  for (let i = 0; i < BULLET_COUNT; i += 1) bullets.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 });
  const pickups = [];
  for (let i = 0; i < PICKUP_COUNT; i += 1) pickups.push({ active: true, x: 0, y: 0, amount: 25 });
  const particles = [];

  const state = {
    player, cars, traffic, peds, police, bullets, pickups, particles,
    buildings, parks, trees, roadsV, roadsH,
    money: 50, health: PLAYER.health, lives: LIVES, wanted: 0, wantedTimer: 0,
    // Mission progress follows the ordered objective list in config.js.
    missionIndex: 0, missionText: MISSIONS[0].text, missionTimer: 0,
    elapsed: 0, score: 50, message: '', messageTimer: 0, shootCooldown: 0, policeSpawnTimer: 0,
  };

  function hitsBuilding(x, y, r) {
    for (let i = 0; i < buildings.length; i += 1) {
      if (circleRect(x, y, r, buildings[i])) return true;
    }
    return false;
  }

  function moveWithCollision(obj, dx, dy, r) {
    const nx = obj.x + dx;
    if (!hitsBuilding(nx, obj.y, r)) obj.x = nx;
    const ny = obj.y + dy;
    if (!hitsBuilding(obj.x, ny, r)) obj.y = ny;
    obj.x = clamp(obj.x, 20, WORLD.width - 20);
    obj.y = clamp(obj.y, 20, WORLD.height - 20);
  }

  function spawnTraffic(car, randomSpot) {
    const vertical = random() < 0.5;
    if (vertical) {
      car.x = roadsV[Math.floor(random() * roadsV.length)] + (random() < 0.5 ? -18 : 18);
      car.y = random() * WORLD.height;
      car.angle = random() < 0.5 ? Math.PI / 2 : -Math.PI / 2;
    } else {
      car.y = roadsH[Math.floor(random() * roadsH.length)] + (random() < 0.5 ? -18 : 18);
      car.x = random() * WORLD.width;
      car.angle = random() < 0.5 ? 0 : Math.PI;
    }
    car.speed = 120 + random() * 60;
    car.color = Math.floor(random() * 5);
    if (randomSpot) return;
  }

  function spawnPed(ped) {
    ped.x = 100 + random() * (WORLD.width - 200);
    ped.y = 100 + random() * (WORLD.height - 200);
    ped.angle = random() * Math.PI * 2;
    ped.speed = 30 + random() * 30;
    ped.color = Math.floor(random() * 4);
  }

  function spawnPickup(pickup) {
    pickup.x = 150 + random() * (WORLD.width - 300);
    pickup.y = 150 + random() * (WORLD.height - 300);
    pickup.amount = 25;
    pickup.active = true;
  }

  function reset() {
    player.x = 1200; player.y = 900; player.angle = -Math.PI / 2; player.speed = 0;
    player.inCar = false; player.carId = -1; player.health = PLAYER.health; player.invulnerable = 0;
    for (let i = 0; i < cars.length; i += 1) {
      const c = cars[i];
      c.x = 350 + (i % PARKED_COUNT) * 220;
      c.y = i < PARKED_COUNT ? 330 + (i % 2) * 40 : 630;
      c.angle = 0; c.speed = 0; c.color = i % 6; c.parked = true; c.active = true;
    }
    for (let i = 0; i < traffic.length; i += 1) spawnTraffic(traffic[i]);
    for (let i = 0; i < peds.length; i += 1) spawnPed(peds[i]);
    for (let i = 0; i < police.length; i += 1) police[i].active = false;
    for (let i = 0; i < bullets.length; i += 1) bullets[i].active = false;
    for (let i = 0; i < pickups.length; i += 1) spawnPickup(pickups[i]);
    particles.length = 0;
    state.money = 50; state.health = PLAYER.health; state.lives = LIVES;
    state.wanted = 0; state.wantedTimer = 0; state.missionIndex = 0;
    state.missionText = MISSIONS[0].text; state.missionTimer = 0;
    state.elapsed = 0; state.score = 50; state.message = ''; state.messageTimer = 0; state.shootCooldown = 0; state.policeSpawnTimer = 0;
  }

  function raiseWanted(n) {
    state.wanted = Math.min(5, state.wanted + n);
    state.wantedTimer = 0;
  }

  function burst(x, y, color, n) {
    for (let i = 0; i < n; i += 1) {
      particles.push({ x, y, vx: (random() - 0.5) * 240, vy: (random() - 0.5) * 240, life: 0.5, color });
    }
    if (particles.length > 80) particles.splice(0, particles.length - 80);
  }

  function nearestCar(maxDist) {
    let best = null;
    let bestD = maxDist * maxDist;
    for (let i = 0; i < cars.length; i += 1) {
      const c = cars[i];
      if (!c.active) continue;
      const d = dist2(player.x, player.y, c.x, c.y);
      if (d < bestD) { bestD = d; best = { car: c, index: i }; }
    }
    return best;
  }

  function step(dt, input, harmless) {
    let events = 0;
    state.elapsed += dt;
    if (state.messageTimer > 0) state.messageTimer -= dt;
    if (player.invulnerable > 0) player.invulnerable -= dt;

    // Traffic and pedestrians always move, even on the title screen.
    for (let i = 0; i < traffic.length; i += 1) {
      const c = traffic[i];
      if (!c.active) continue;
      c.x += Math.cos(c.angle) * c.speed * dt;
      c.y += Math.sin(c.angle) * c.speed * dt;
      if (c.x < 0 || c.x > WORLD.width || c.y < 0 || c.y > WORLD.height) spawnTraffic(c);
      if (random() < dt * 0.05) {
        // Turn at an intersection sometimes.
        if (Math.abs(c.angle) < 0.1 || Math.abs(Math.abs(c.angle) - Math.PI) < 0.1) c.angle += (random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
        else c.angle += (random() < 0.5 ? Math.PI / 2 : -Math.PI / 2);
      }
    }
    for (let i = 0; i < peds.length; i += 1) {
      const p = peds[i];
      if (!p.active) continue;
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
      if (p.x < 40 || p.x > WORLD.width - 40 || p.y < 40 || p.y > WORLD.height - 40 || random() < dt * 0.1) p.angle = random() * Math.PI * 2;
      // Flee from a fast car nearby.
      if (player.inCar && dist2(p.x, p.y, player.x, player.y) < 120 * 120) {
        p.angle = Math.atan2(p.y - player.y, p.x - player.x);
        p.x += Math.cos(p.angle) * 60 * dt;
        p.y += Math.sin(p.angle) * 60 * dt;
      }
    }
    if (harmless) return 0;

    const vx = input ? input.x || 0 : 0;
    const vy = input ? input.y || 0 : 0;

    // Enter / exit a car.
    if (input && input.enter) {
      if (!player.inCar) {
        const near = nearestCar(70);
        if (near) {
          player.inCar = true;
          player.carId = near.index;
          if (near.car.parked) {
            near.car.parked = false;
            raiseWanted(1);
            state.message = 'Car stolen! Wanted +1'; state.messageTimer = 2.5;
          } else {
            state.message = 'You took the car'; state.messageTimer = 2;
          }
        }
      } else {
        player.inCar = false;
        player.carId = -1;
        player.x += Math.cos(player.angle + Math.PI / 2) * 40;
        player.y += Math.sin(player.angle + Math.PI / 2) * 40;
      }
    }

    if (player.inCar) {
      // Simple car physics: forward/back with steering.
      const forward = -vy; // up key = forward
      const steer = vx;
      player.speed += forward * CAR.accel * dt;
      player.speed *= Math.max(0, 1 - 1.6 * dt);
      player.speed = clamp(player.speed, -CAR.maxReverse, CAR.maxSpeed);
      if (Math.abs(player.speed) > 20) player.angle += steer * CAR.turn * dt * (player.speed > 0 ? 1 : -1);
      const nx = player.x + Math.cos(player.angle) * player.speed * dt;
      const ny = player.y + Math.sin(player.angle) * player.speed * dt;
      if (!hitsBuilding(nx, player.y, 26)) player.x = nx; else player.speed *= 0.4;
      if (!hitsBuilding(player.x, ny, 26)) player.y = ny; else player.speed *= 0.4;
      player.x = clamp(player.x, 20, WORLD.width - 20);
      player.y = clamp(player.y, 20, WORLD.height - 20);
      // Hitting a pedestrian while driving.
      for (let i = 0; i < peds.length; i += 1) {
        const p = peds[i];
        if (!p.active) continue;
        if (dist2(p.x, p.y, player.x, player.y) < 34 * 34 && Math.abs(player.speed) > 60) {
          p.active = false;
          burst(p.x, p.y, '#f5e6c8', 8);
          raiseWanted(1);
          state.message = 'Pedestrian hit! Wanted +1'; state.messageTimer = 2.5;
          events |= EVENT_HIT;
          spawnPed(p);
          p.active = true;
        }
      }
    } else {
      // On foot.
      if (vx !== 0 || vy !== 0) player.angle = Math.atan2(vy, vx);
      moveWithCollision(player, vx * PLAYER.speed * dt, vy * PLAYER.speed * dt, 14);
      // Traffic can hit the player on foot.
      for (let i = 0; i < traffic.length; i += 1) {
        const c = traffic[i];
        if (!c.active) continue;
        if (dist2(c.x, c.y, player.x, player.y) < 32 * 32 && player.invulnerable <= 0) {
          player.health -= 10;
          player.invulnerable = PLAYER.invulnerable;
          burst(player.x, player.y, '#ff5a5a', 8);
          events |= EVENT_HIT;
        }
      }
    }

    // Sync the player's car with the player when driving.
    if (player.inCar && player.carId >= 0 && cars[player.carId]) {
      const c = cars[player.carId];
      c.x = player.x; c.y = player.y; c.angle = player.angle; c.speed = player.speed;
    }

    // Police: spawn to match wanted level, chase the player.
    state.policeSpawnTimer = Math.max(0, state.policeSpawnTimer - dt);
    const wantPolice = state.wanted === 0 ? 0 : state.wanted <= 2 ? 1 : state.wanted === 3 ? 2 : 3;
    for (let i = 0; i < police.length; i += 1) {
      const p = police[i];
      if (i < wantPolice && !p.active && state.policeSpawnTimer <= 0) {
        p.active = true;
        p.x = clamp(player.x + (random() < 0.5 ? -500 : 500), 40, WORLD.width - 40);
        p.y = clamp(player.y + (random() < 0.5 ? -400 : 400), 40, WORLD.height - 40);
        p.speed = 0;
        state.policeSpawnTimer = state.wanted <= 2 ? 12 : 3;
      } else if (i >= wantPolice) p.active = false;
      if (!p.active) continue;
      const target = Math.atan2(player.y - p.y, player.x - p.x);
      let diff = target - p.angle;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      p.angle += clamp(diff, -2.2 * dt, 2.2 * dt);
      p.speed = Math.min(390, p.speed + 240 * dt);
      p.x += Math.cos(p.angle) * p.speed * dt;
      p.y += Math.sin(p.angle) * p.speed * dt;
      if (dist2(p.x, p.y, player.x, player.y) < 44 * 44 && player.invulnerable <= 0) {
        player.health -= 3;
        player.invulnerable = PLAYER.invulnerable;
        burst(player.x, player.y, '#1c2733', 6);
        events |= EVENT_HIT;
      }
    }

    // Wanted decays when calm.
    state.wantedTimer += dt;
    if (state.wanted > 0 && state.wantedTimer > 20) {
      state.wanted -= 1;
      state.wantedTimer = 0;
    }

    // Shooting.
    if (state.shootCooldown > 0) state.shootCooldown -= dt;
    if (input && input.shoot && state.shootCooldown <= 0) {
      state.shootCooldown = 0.28;
      let free = null;
      for (let i = 0; i < bullets.length; i += 1) if (!bullets[i].active) { free = bullets[i]; break; }
      if (free) {
        free.active = true;
        free.x = player.x + Math.cos(player.angle) * 24;
        free.y = player.y + Math.sin(player.angle) * 24;
        free.vx = Math.cos(player.angle) * 700;
        free.vy = Math.sin(player.angle) * 700;
        free.life = 0.6;
      }
      if (state.wanted < 5 && random() < 0.2) raiseWanted(1);
    }
    for (let i = 0; i < bullets.length; i += 1) {
      const b = bullets[i];
      if (!b.active) continue;
      b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
      if (b.life <= 0 || b.x < 0 || b.x > WORLD.width || b.y < 0 || b.y > WORLD.height) { b.active = false; continue; }
      // Hit traffic or police.
      let hit = false;
      for (let j = 0; j < traffic.length; j += 1) {
        const c = traffic[j];
        if (c.active && dist2(b.x, b.y, c.x, c.y) < 30 * 30) {
          c.active = false; hit = true;
          state.money += 10; state.score = state.money;
          burst(c.x, c.y, '#ffd23f', 10);
          spawnTraffic(c);
          c.active = true;
          break;
        }
      }
      if (!hit) {
        for (let j = 0; j < police.length; j += 1) {
          const p = police[j];
          if (p.active && dist2(b.x, b.y, p.x, p.y) < 32 * 32) {
            p.active = false; hit = true;
            state.money += 10; state.score = state.money;
            raiseWanted(1);
            burst(p.x, p.y, '#ff5a5a', 10);
            break;
          }
        }
      }
      if (hit) b.active = false;
    }

    // Cash pickups.
    for (let i = 0; i < pickups.length; i += 1) {
      const p = pickups[i];
      if (!p.active) continue;
      if (dist2(p.x, p.y, player.x, player.y) < 36 * 36) {
        p.active = false;
        state.money += p.amount; state.score = state.money;
        burst(p.x, p.y, '#f2c94c', 8);
        events |= EVENT_COIN;
        spawnPickup(p);
      }
    }

    // Particles.
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      const p = particles[i];
      p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }

    // Missions.
    state.missionTimer += dt;
    if (state.missionIndex < MISSIONS.length) {
      const m = MISSIONS[state.missionIndex];
      state.missionText = m.text;
      if (dist2(player.x, player.y, m.x, m.y) < 70 * 70) {
        state.money += m.reward; state.score = state.money;
        state.message = 'Mission complete! +$' + m.reward; state.messageTimer = 3;
        events |= EVENT_MISSION;
        if (state.missionIndex === 2) {
          state.wanted = 0;
          state.missionText = 'Story complete - free roam';
        }
        state.missionIndex += 1;
        if (state.missionIndex === 2) {
          state.wanted = 3;
          state.message = 'Mission 3: Lose the cops! Wanted 3'; state.messageTimer = 3;
        }
      }
    } else {
      state.missionText = 'Story complete - free roam';
    }

    state.health = player.health;
    if (player.health <= 0) {
      state.lives = 0;
      return events | EVENT_OVER;
    }
    return events;
  }

  reset();
  return { state, reset, step };
}
