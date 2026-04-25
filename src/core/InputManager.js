export class InputManager {
  constructor() {
    this.keys = {};
    this.mouse = { x: 0, y: 0, deltaX: 0, deltaY: 0 };
    this.mouseButtons = {};
    this.isPointerLocked = false;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Keyboard
    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Mouse
    document.addEventListener('mousedown', (e) => {
      this.mouseButtons[e.button] = true;
    });

    document.addEventListener('mouseup', (e) => {
      this.mouseButtons[e.button] = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.isPointerLocked) {
        this.mouse.deltaX = e.movementX;
        this.mouse.deltaY = e.movementY;
      }
    });

    // Pointer lock
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = document.pointerLockElement !== null;
    });
  }

  requestPointerLock() {
    document.body.requestPointerLock();
  }

  exitPointerLock() {
    if (this.isPointerLocked) {
      document.exitPointerLock();
    }
  }

  isKeyPressed(code) {
    return this.keys[code] === true;
  }

  isMouseButtonPressed(button) {
    return this.mouseButtons[button] === true;
  }

  getMouseDelta() {
    const delta = { x: this.mouse.deltaX, y: this.mouse.deltaY };
    // Reset delta after reading
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
    return delta;
  }

  reset() {
    this.keys = {};
    this.mouseButtons = {};
    this.mouse.deltaX = 0;
    this.mouse.deltaY = 0;
  }
}
