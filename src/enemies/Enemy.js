import * as THREE from 'three';
import { Config } from '../utils/Config.js';
import { NeonMaterials } from '../environment/NeonMaterials.js';
import EventBus from '../utils/EventBus.js';

export class Enemy {
  constructor(scene, position) {
    this.scene = scene;
    this.health = Config.ENEMY_HEALTH;
    this.maxHealth = Config.ENEMY_HEALTH;
    this.isAlive = true;
    this.position = position.clone();
    this.velocity = new THREE.Vector3();

    // AI state
    this.state = 'patrol';
    this.target = null;
    this.patrolIndex = 0;
    this.lastSeenPlayerPos = null;
    this.fireTimer = 0;

    // Create mesh
    this.createMesh();
  }

  createMesh() {
    // Enemy body (simple humanoid shape)
    this.mesh = new THREE.Group();

    // Body - increased hitbox size
    const bodyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.6);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B00FF,
      emissive: 0x8B00FF,
      emissiveIntensity: 0.5
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.9;
    body.castShadow = true;
    this.mesh.add(body);

    // Head - increased hitbox size
    const headGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const head = new THREE.Mesh(headGeometry, bodyMaterial);
    head.position.y = 2.1;
    head.castShadow = true;
    head.userData.isHead = true; // Mark as head for headshot detection
    this.mesh.add(head);

    // Eyes (glowing)
    const eyeGeometry = new THREE.SphereGeometry(0.08, 6, 6);
    const eyeMaterial = NeonMaterials.createNeonTrim(Config.COLORS.NEON_PINK);

    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 2.1, 0.25);
    leftEye.userData.isHead = true; // Eyes count as headshots
    this.mesh.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 2.1, 0.25);
    rightEye.userData.isHead = true; // Eyes count as headshots
    this.mesh.add(rightEye);

    // Set mesh position
    this.mesh.position.copy(this.position);

    // Add collision reference
    this.mesh.userData.enemy = this;
    body.userData.enemy = this;
    head.userData.enemy = this;
    leftEye.userData.enemy = this;
    rightEye.userData.enemy = this;

    this.scene.add(this.mesh);
  }

  takeDamage(amount) {
    if (!this.isAlive) return;

    this.health -= amount;

    if (this.health <= 0) {
      this.health = 0;
      this.die();
    } else {
      // Flash red when hit
      this.mesh.children.forEach(child => {
        if (child.material) {
          const originalColor = child.material.emissive.getHex();
          child.material.emissive.setHex(0xFF0000);

          setTimeout(() => {
            child.material.emissive.setHex(originalColor);
          }, 100);
        }
      });
    }
  }

  die() {
    this.isAlive = false;
    this.state = 'dead';

    // Emit enemy death event
    EventBus.emit('enemy:death', { enemy: this });

    // Death animation (fall down)
    const fallDuration = 0.5;
    let elapsed = 0;

    const fallInterval = setInterval(() => {
      elapsed += 0.016;
      const progress = elapsed / fallDuration;

      this.mesh.rotation.x = progress * Math.PI / 2;
      this.mesh.position.y = Math.max(0, this.position.y * (1 - progress));

      if (progress >= 1) {
        clearInterval(fallInterval);

        // Fade out and remove
        setTimeout(() => {
          let opacity = 1;
          const fadeInterval = setInterval(() => {
            opacity -= 0.05;

            this.mesh.children.forEach(child => {
              if (child.material) {
                child.material.transparent = true;
                child.material.opacity = opacity;
              }
            });

            if (opacity <= 0) {
              clearInterval(fadeInterval);
              this.remove();
            }
          }, 16);
        }, 1000);
      }
    }, 16);
  }

  moveTo(targetPos, deltaTime) {
    const direction = new THREE.Vector3()
      .subVectors(targetPos, this.position)
      .normalize();

    const moveDistance = Config.ENEMY_SPEED * deltaTime;
    this.velocity.copy(direction).multiplyScalar(moveDistance);

    this.position.add(this.velocity);
    this.mesh.position.copy(this.position);

    // Face movement direction
    if (this.velocity.length() > 0.01) {
      const angle = Math.atan2(this.velocity.x, this.velocity.z);
      this.mesh.rotation.y = angle;
    }
  }

  lookAt(targetPos) {
    const direction = new THREE.Vector3().subVectors(targetPos, this.position);
    const angle = Math.atan2(direction.x, direction.z);
    this.mesh.rotation.y = angle;
  }

  remove() {
    this.scene.remove(this.mesh);

    // Cleanup geometry and materials
    this.mesh.children.forEach(child => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}
