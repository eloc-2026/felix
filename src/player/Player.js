import * as THREE from 'three';
import { Config } from '../utils/Config.js';
import EventBus from '../utils/EventBus.js';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.health = Config.PLAYER_MAX_HEALTH;
    this.isAlive = true;
    this.kills = 0;

    // Position
    this.position = new THREE.Vector3(0, Config.PLAYER_HEIGHT, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Rotation
    this.rotation = new THREE.Euler(0, 0, 0, 'YXZ');
    this.pitch = 0; // Up/down
    this.yaw = 0;   // Left/right
  }

  takeDamage(amount) {
    if (!this.isAlive) return;

    this.health -= amount;
    EventBus.emit('player:damage', { health: this.health, damage: amount });

    if (this.health <= 0) {
      this.health = 0;
      this.die();
    }
  }

  die() {
    this.isAlive = false;
    EventBus.emit('player:death', { kills: this.kills });
  }

  addKill() {
    this.kills++;
    EventBus.emit('player:kill', { kills: this.kills });
  }

  reset() {
    this.health = Config.PLAYER_MAX_HEALTH;
    this.isAlive = true;
    this.kills = 0;
    this.position.set(0, Config.PLAYER_HEIGHT, 0);
    this.velocity.set(0, 0, 0);
    this.pitch = 0;
    this.yaw = 0;
    EventBus.emit('player:reset', {});
  }
}
