import * as THREE from 'three';
import { Enemy } from './Enemy.js';
import { AIController } from './AIController.js';
import { Config } from '../utils/Config.js';
import EventBus from '../utils/EventBus.js';

export class EnemySpawner {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;
    this.enemies = [];
    this.aiControllers = [];
    this.spawnPoints = this.generateSpawnPoints();
  }

  generateSpawnPoints() {
    const points = [];
    const radius = 30;
    const count = 8;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }

    return points;
  }

  spawnWave(enemyCount = 5) {
    for (let i = 0; i < enemyCount; i++) {
      const spawnPoint = this.spawnPoints[i % this.spawnPoints.length].clone();

      // Add some randomness
      spawnPoint.x += (Math.random() - 0.5) * 10;
      spawnPoint.z += (Math.random() - 0.5) * 10;

      const enemy = new Enemy(this.scene, spawnPoint);
      const aiController = new AIController(enemy, this.player, this.scene);

      this.enemies.push(enemy);
      this.aiControllers.push(aiController);
    }
  }

  update(deltaTime) {
    // Update all AI controllers
    for (let i = this.aiControllers.length - 1; i >= 0; i--) {
      const ai = this.aiControllers[i];
      const enemy = this.enemies[i];

      if (!enemy.isAlive) {
        // Remove dead enemy after delay
        if (enemy.state === 'dead') {
          // Keep in array for a bit for visual effects
          continue;
        }
      }

      ai.update(deltaTime);
    }

    // Clean up fully removed enemies
    this.enemies = this.enemies.filter(enemy => enemy.isAlive || enemy.mesh.parent !== null);
    this.aiControllers = this.aiControllers.slice(0, this.enemies.length);

    // Check if all enemies dead - spawn new wave
    if (this.enemies.filter(e => e.isAlive).length === 0) {
      setTimeout(() => {
        this.spawnWave(5 + Math.floor(this.enemies.length / 5)); // Increase difficulty
      }, 3000);
    }
  }

  getEnemyMeshes() {
    return this.enemies.filter(e => e.isAlive).map(e => e.mesh);
  }

  reset() {
    // Remove all enemies
    this.enemies.forEach(enemy => {
      if (enemy.mesh.parent) {
        enemy.remove();
      }
    });

    this.enemies = [];
    this.aiControllers = [];

    // Spawn initial wave
    this.spawnWave(5);
  }
}
