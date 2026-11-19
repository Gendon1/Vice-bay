// Vice Bay v1.3: canvas rendering for the city, game screens, and HUD.
// Drawing only: the world's state and the current screen in, pixels out.
// Top-down camera follows the player. Sun-soaked city, HUD, minimap.
import { FIELD, FONT, LIVES, MISSIONS, PALETTE, WORLD } from './config.js';
import { CONTROLS_HINT } from './input.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const PANEL = { width: 640, top: 150, line: 32, bottom: 70 };
const CAR_COLORS = ['#e53935', '#4fc3f7', '#ffd23f', '#3ddc84', '#b388ff', '#ff7aa8'];
const BUILDING_COLORS = ['#e58b62', '#8298b2', '#f0bd58', '#db7190', '#62b9a6', '#ae8ed0'];
const ROOF_COLORS = ['#d95f59', '#edaa4a', '#54a69b', '#6589bd', '#bb6d9b', '#d4c16d', '#9674b4', '#617d68'];
const TREE_COLORS = ['#27783b', '#368b43', '#4b9d4e', '#68ad55'];

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };
  const moneyLabel = cachedLabel('Money $');
  const bestLabel = cachedLabel('Best $');

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align || 'left';
    context.fillText(value, x, y);
  }

  function roundRect(x, y, w, h, r) {
    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + w, y, x + w, y + h, r);
    context.arcTo(x + w, y + h, x, y + h, r);
    context.arcTo(x, y + h, x, y, r);
    context.arcTo(x, y, x + w, y, r);
    context.closePath();
  }

  function drawCar(x, y, angle, color, isPlayer, isPolice) {
    context.save();
    context.translate(x, y);
    context.rotate(angle);
    context.fillStyle = 'rgba(0,0,0,0.25)';
    roundRect(-26, -12, 56, 28, 8);
    context.fill();
    context.fillStyle = isPolice ? '#f5f5f5' : color;
    roundRect(-28, -14, 56, 28, 8);
    context.fill();
    if (isPolice) {
      context.fillStyle = '#1c2733';
      context.fillRect(-6, -14, 12, 28);
      context.fillStyle = (Math.floor(Date.now() / 300) % 2 === 0) ? '#ff3b30' : '#3b82f6';
      context.fillRect(-4, -16, 8, 5);
    } else {
      context.fillStyle = '#bfe8ff';
      context.fillRect(-6, -11, 14, 22);
    }
    context.fillStyle = '#fff8c0';
    context.fillRect(24, -11, 4, 6);
    context.fillRect(24, 5, 4, 6);
    if (isPlayer) {
      context.strokeStyle = '#ffffff';
      context.lineWidth = 3;
      roundRect(-30, -16, 60, 32, 9);
      context.stroke();
    }
    context.restore();
  }

  function drawCity(state, camX, camY) {
    // Grass base.
    context.fillStyle = PALETTE.grass;
    context.fillRect(camX - 40, camY - 40, WORLD.width + 80, WORLD.height + 80);
    // Beach and water, south strip.
    context.fillStyle = PALETTE.sand;
    context.fillRect(camX, 1650, WORLD.width, 60);
    context.fillStyle = PALETTE.water;
    context.fillRect(camX, 1710, WORLD.width, 90);
    context.fillStyle = 'rgba(255,255,255,0.35)';
    for (let x = 0; x < WORLD.width; x += 120) {
      context.fillRect(x + ((state.elapsed * 20) % 120), 1740, 60, 4);
    }
    // Parks.
    for (let i = 0; i < state.parks.length; i += 1) {
      const p = state.parks[i];
      context.fillStyle = PALETTE.park;
      context.fillRect(p.x, p.y, p.w, p.h);
    }
    // Trees are placed throughout the parks for a greener, busier city.
    for (let i = 0; i < state.trees.length; i += 1) {
      const tree = state.trees[i];
      context.fillStyle = '#76523b';
      context.fillRect(tree.x - 3, tree.y, 6, tree.size);
      context.fillStyle = TREE_COLORS[tree.color % TREE_COLORS.length];
      context.beginPath();
      context.arc(tree.x, tree.y, tree.size, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = 'rgba(255,255,255,0.16)';
      context.beginPath();
      context.arc(tree.x - tree.size * 0.28, tree.y - tree.size * 0.3, tree.size * 0.4, 0, Math.PI * 2);
      context.fill();
    }
    // Roads.
    context.fillStyle = PALETTE.road;
    for (let i = 0; i < state.roadsV.length; i += 1) {
      context.fillRect(state.roadsV[i] - 35, 0, 70, WORLD.height);
    }
    for (let i = 0; i < state.roadsH.length; i += 1) {
      context.fillRect(0, state.roadsH[i] - 35, WORLD.width, 70);
    }
    // Lane dashes.
    context.fillStyle = PALETTE.roadLine;
    for (let i = 0; i < state.roadsV.length; i += 1) {
      for (let y = 0; y < WORLD.height; y += 60) context.fillRect(state.roadsV[i] - 2, y, 4, 30);
    }
    for (let i = 0; i < state.roadsH.length; i += 1) {
      for (let x = 0; x < WORLD.width; x += 60) context.fillRect(x, state.roadsH[i] - 2, 30, 4);
    }
    // Buildings with shadows and roofs.
    for (let i = 0; i < state.buildings.length; i += 1) {
      const b = state.buildings[i];
      context.fillStyle = 'rgba(0,0,0,0.25)';
      context.fillRect(b.x + 6, b.y + 8, b.w, b.h);
      context.fillStyle = BUILDING_COLORS[b.color % BUILDING_COLORS.length];
      context.fillRect(b.x, b.y, b.w, b.h);
      context.fillStyle = ROOF_COLORS[b.roofColor % ROOF_COLORS.length];
      context.fillRect(b.x + 8, b.y + 8, b.w - 16, b.h - 16);
      context.fillStyle = 'rgba(255,255,255,0.25)';
      context.fillRect(b.x, b.y, b.w, 10);
      context.fillStyle = '#2a2a2a';
      for (let wx = b.x + 12; wx < b.x + b.w - 12; wx += 26) {
        for (let wy = b.y + 16; wy < b.y + b.h - 12; wy += 26) context.fillRect(wx, wy, 10, 12);
      }
    }
    // Mission marker.
    if (state.missionIndex < MISSIONS.length) {
      const m = MISSIONS[state.missionIndex];
      const pulse = 60 + Math.sin(state.elapsed * 4) * 10;
      context.strokeStyle = m.color;
      context.lineWidth = 4;
      context.beginPath();
      context.arc(m.x, m.y, pulse, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = m.color;
      context.beginPath();
      context.arc(m.x, m.y, 10, 0, Math.PI * 2);
      context.fill();
    }
    // Cash pickups.
    for (let i = 0; i < state.pickups.length; i += 1) {
      const p = state.pickups[i];
      if (!p.active) continue;
      context.fillStyle = PALETTE.coin;
      context.beginPath();
      context.arc(p.x, p.y, 12, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#7a5a00';
      text('$', p.x - 5, p.y - 6, 16, '#7a5a00', 'left');
    }
    // Parked and traffic cars.
    for (let i = 0; i < state.cars.length; i += 1) {
      const c = state.cars[i];
      if (!c.active) continue;
      drawCar(c.x, c.y, c.angle, CAR_COLORS[c.color % CAR_COLORS.length], state.player.inCar && state.player.carId === i, false);
    }
    for (let i = 0; i < state.traffic.length; i += 1) {
      const c = state.traffic[i];
      if (!c.active) continue;
      drawCar(c.x, c.y, c.angle, CAR_COLORS[c.color % CAR_COLORS.length], false, false);
    }
    for (let i = 0; i < state.police.length; i += 1) {
      const p = state.police[i];
      if (!p.active) continue;
      drawCar(p.x, p.y, p.angle, '#ffffff', false, true);
    }
    // Pedestrians.
    for (let i = 0; i < state.peds.length; i += 1) {
      const p = state.peds[i];
      if (!p.active) continue;
      context.fillStyle = ['#f5e6c8', '#ff9f43', '#a78bfa', '#34d399'][p.color % 4];
      context.beginPath();
      context.arc(p.x, p.y, 9, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#1c2733';
      context.beginPath();
      context.arc(p.x, p.y - 3, 4, 0, Math.PI * 2);
      context.fill();
    }
    // Bullets and particles.
    for (let i = 0; i < state.bullets.length; i += 1) {
      const b = state.bullets[i];
      if (!b.active) continue;
      context.fillStyle = '#ffd23f';
      context.beginPath();
      context.arc(b.x, b.y, 5, 0, Math.PI * 2);
      context.fill();
    }
    for (let i = 0; i < state.particles.length; i += 1) {
      const p = state.particles[i];
      context.fillStyle = p.color;
      context.fillRect(p.x - 3, p.y - 3, 6, 6);
    }
    // Player on foot.
    const pl = state.player;
    if (!pl.inCar) {
      if (pl.invulnerable <= 0 || Math.floor(pl.invulnerable * 10) % 2 === 1) {
        context.fillStyle = PALETTE.player;
        context.beginPath();
        context.arc(pl.x, pl.y, 14, 0, Math.PI * 2);
        context.fill();
        context.fillStyle = '#1c2733';
        context.beginPath();
        context.arc(pl.x + Math.cos(pl.angle) * 8, pl.y + Math.sin(pl.angle) * 8, 5, 0, Math.PI * 2);
        context.fill();
      }
    }
  }

  function drawHud(state) {
    // The HUD keeps money, health, wanted level, mission, and map at a glance.
    // Top bar.
    context.fillStyle = 'rgba(16,24,32,0.85)';
    context.fillRect(0, 0, FIELD.width, 64);
    context.textBaseline = 'top';
    text(moneyLabel(state.money), 20, 18, 28, PALETTE.text, 'left');
    text('Health', 260, 18, 20, PALETTE.muted, 'left');
    context.fillStyle = '#333';
    context.fillRect(340, 20, 160, 18);
    context.fillStyle = state.health > 40 ? '#3ddc84' : '#ff5a5a';
    context.fillRect(340, 20, 160 * Math.max(0, state.health) / 100, 18);
    // Wanted stars.
    let stars = '';
    for (let i = 0; i < 5; i += 1) stars += i < state.wanted ? '★' : '☆';
    text(stars, 560, 16, 28, '#ffd23f', 'left');
    text(state.missionIndex < MISSIONS.length ? ('Mission ' + (state.missionIndex + 1) + '/3: ' + state.missionText) : 'Free roam', 760, 18, 20, PALETTE.text, 'left');
    if (state.messageTimer > 0 && state.message) {
      context.fillStyle = 'rgba(16,24,32,0.85)';
      context.fillRect(FIELD.width / 2 - 260, 76, 520, 36);
      text(state.message, FIELD.width / 2, 84, 20, '#ffd23f', 'center');
    }
    // Controls hint.
    text('WASD move/drive  •  E steal car  •  Space shoot  •  P pause', 20, FIELD.height - 28, 16, 'rgba(255,255,255,0.75)', 'left');
    drawMinimap(state);
  }

  function drawMinimap(state) {
    const mw = 180;
    const mh = 130;
    const mx = FIELD.width - mw - 16;
    const my = FIELD.height - mh - 16;
    const sx = mw / WORLD.width;
    const sy = mh / WORLD.height;
    context.fillStyle = PALETTE.minimap;
    context.fillRect(mx, my, mw, mh);
    context.strokeStyle = '#4a5568';
    context.lineWidth = 1;
    context.strokeRect(mx, my, mw, mh);
    context.fillStyle = '#3a3f4a';
    for (let i = 0; i < state.roadsV.length; i += 1) context.fillRect(mx + state.roadsV[i] * sx - 1, my, 2, mh);
    for (let i = 0; i < state.roadsH.length; i += 1) context.fillRect(mx, my + state.roadsH[i] * sy, mw, 2);
    if (state.missionIndex < MISSIONS.length) {
      const m = MISSIONS[state.missionIndex];
      context.fillStyle = m.color;
      context.beginPath();
      context.arc(mx + m.x * sx, my + m.y * sy, 5, 0, Math.PI * 2);
      context.fill();
    }
    for (let i = 0; i < state.police.length; i += 1) {
      const p = state.police[i];
      if (!p.active) continue;
      context.fillStyle = '#ff3b30';
      context.fillRect(mx + p.x * sx - 2, my + p.y * sy - 2, 4, 4);
    }
    context.fillStyle = '#ffffff';
    context.beginPath();
    context.arc(mx + state.player.x * sx, my + state.player.y * sy, 4, 0, Math.PI * 2);
    context.fill();
    text('VICE BAY', mx, my - 18, 14, '#ffffff', 'left');
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = 'rgba(16,24,32,0.92)';
    context.fillRect(x, y, PANEL.width, height);
    context.strokeStyle = '#ffd23f';
    context.lineWidth = 3;
    context.strokeRect(x, y, PANEL.width, height);
    context.textBaseline = 'alphabetic';
    text(title, FIELD.width / 2, y + 78, 52, PALETTE.text, 'center');
    for (let index = 0; index < lines.length; index += 1) {
      text(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 20, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 36, 22, PALETTE.coin, 'center');
  }

  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    const camX = Math.max(0, Math.min(WORLD.width - FIELD.width, state.player.x - FIELD.width / 2));
    const camY = Math.max(0, Math.min(WORLD.height - FIELD.height, state.player.y - FIELD.height / 2));
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    context.save();
    context.beginPath();
    context.rect(0, 0, FIELD.width, FIELD.height);
    context.clip();
    context.translate(-camX, -camY);
    drawCity(state, camX, camY);
    context.restore();
    if (screen === SCREEN_TITLE) {
      const lines = [
        'Sun-soaked open world. Steal cars, lose the cops, run missions.',
        CONTROLS_HINT,
        '3 missions: Getaway $200, Pickup $150, Lose the cops $300',
        bestLabel(best),
      ];
      drawPanel('VICE BAY', lines, 'Press Space or click to start');
      return;
    }
    drawHud(state);
    if (screen === SCREEN_PAUSED) drawPanel('Paused', ['The city will wait for you.'], 'Press P to resume');
    else if (screen === SCREEN_OVER) {
      drawPanel('Busted', [moneyLabel(state.money), bestLabel(best), 'The Vice Bay story continues next time.'], 'Press Space to play again');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
