// Vice Bay v1.3: keyboard and pointer controls for the game.
// Keyboard and pointer input. WASD/arrows give a 2D steering vector.
// One-shot presses (start, pause, enter/exit car) are queued as bit flags
// and taken once by the loop, so a press between two frames is never lost.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_ENTER = 4;
export const CONTROLS_HINT = 'WASD / arrows: move & steer  •  E: enter / exit car  •  Space: shoot / confirm  •  P / Esc: pause';

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const ENTER = new Set(['KeyE']);

export function createInput(target) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let shoot = false;
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (event.code === 'Space') {
      shoot = true;
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (ENTER.has(event.code)) {
      if (!event.repeat) actions |= ACTION_ENTER;
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
    else if (event.code === 'Space') shoot = false;
  });
  window.addEventListener('blur', () => {
    up = false; down = false; left = false; right = false; shoot = false;
  });
  target.addEventListener('pointerdown', () => {
    actions |= ACTION_CONFIRM;
  });

  function vector() {
    const x = (right ? 1 : 0) - (left ? 1 : 0);
    const y = (down ? 1 : 0) - (up ? 1 : 0);
    if (x !== 0 && y !== 0) {
      const s = Math.SQRT1_2;
      return { x: x * s, y: y * s };
    }
    return { x, y };
  }

  return {
    /** -1 for left, 1 for right, 0 for neither or both (legacy). */
    direction() {
      return (right ? 1 : 0) - (left ? 1 : 0);
    },
    vector,
    shootHeld() {
      return shoot;
    },
    enterPressed() {
      const pressed = (actions & ACTION_ENTER) !== 0;
      actions &= ~ACTION_ENTER;
      return pressed;
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
  };
}
