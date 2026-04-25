import EventBus from '../utils/EventBus.js';
import * as THREE from 'three';

export class DamageSystem {
  constructor(camera, postProcessing) {
    this.camera = camera;
    this.postProcessing = postProcessing;

    // Damage feedback
    this.damageShakeIntensity = 0;
    this.damageVignetteIntensity = 0.5;

    // Setup event listeners
    EventBus.on('player:damage', (data) => this.onPlayerDamage(data));
    EventBus.on('player:reset', () => this.reset());
  }

  onPlayerDamage(data) {
    // Screen shake
    this.damageShakeIntensity = 0.02;

    // Vignette intensity based on health
    const healthPercent = data.health / 100;
    this.damageVignetteIntensity = 0.5 + (1 - healthPercent) * 0.4;

    // Update post-processing vignette
    this.postProcessing.setVignetteDarkness(this.damageVignetteIntensity);
  }

  update(deltaTime) {
    // Screen shake recovery
    if (this.damageShakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.damageShakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.damageShakeIntensity;

      this.camera.position.x += shakeX;
      this.camera.position.y += shakeY;

      this.damageShakeIntensity *= 0.9;

      if (this.damageShakeIntensity < 0.001) {
        this.damageShakeIntensity = 0;
      }
    }
  }

  reset() {
    this.damageShakeIntensity = 0;
    this.damageVignetteIntensity = 0.5;
    this.postProcessing.setVignetteDarkness(0.5);
  }
}
