import { Config } from '../utils/Config.js';

export class GameLoop {
  constructor(updateCallback, renderCallback) {
    this.updateCallback = updateCallback;
    this.renderCallback = renderCallback;
    this.isRunning = false;
    this.lastTime = 0;
    this.accumulator = 0;
    this.fixedDeltaTime = Config.FIXED_TIMESTEP;
  }

  start() {
    this.isRunning = true;
    this.lastTime = performance.now() / 1000;
    this.loop();
  }

  stop() {
    this.isRunning = false;
  }

  loop = () => {
    if (!this.isRunning) return;

    const currentTime = performance.now() / 1000;
    let deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Cap delta time to prevent spiral of death
    if (deltaTime > 0.25) deltaTime = 0.25;

    this.accumulator += deltaTime;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedDeltaTime) {
      this.updateCallback(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }

    // Render with interpolation factor
    const alpha = this.accumulator / this.fixedDeltaTime;
    this.renderCallback(alpha);

    requestAnimationFrame(this.loop);
  };
}
