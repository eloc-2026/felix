import * as THREE from 'three';
import EventBus from '../utils/EventBus.js';

export class ProjectileSystem {
  constructor(scene) {
    this.scene = scene;
    this.projectiles = [];
    this.raycaster = new THREE.Raycaster();
  }

  fireBullet(origin, direction, weaponData, enemies) {
    const results = [];

    // Fire multiple pellets for shotguns
    for (let i = 0; i < weaponData.pelletCount; i++) {
      // Apply spread
      const spreadDir = direction.clone();
      const spread = weaponData.spread;

      spreadDir.x += (Math.random() - 0.5) * spread;
      spreadDir.y += (Math.random() - 0.5) * spread;
      spreadDir.z += (Math.random() - 0.5) * spread;
      spreadDir.normalize();

      // Raycast for hit detection
      this.raycaster.set(origin, spreadDir);
      this.raycaster.far = weaponData.range;

      // Check hits against enemies
      const hits = this.raycaster.intersectObjects(enemies, true);

      if (hits.length > 0) {
        const hit = hits[0];
        results.push({
          hit: true,
          point: hit.point,
          distance: hit.distance,
          object: hit.object,
          damage: this.calculateDamage(weaponData, hit.distance)
        });

        // Create impact effect at hit point
        this.createImpactEffect(hit.point);
      } else {
        // Miss - create bullet trail
        const endPoint = origin.clone().add(spreadDir.multiplyScalar(weaponData.range));
        results.push({
          hit: false,
          point: endPoint,
          distance: weaponData.range
        });
      }

      // Create visual bullet trail
      this.createBulletTrail(origin, results[results.length - 1].point);
    }

    return results;
  }

  calculateDamage(weaponData, distance) {
    let damage = weaponData.damage;

    // Distance falloff
    const halfRange = weaponData.range * 0.5;
    if (distance > halfRange) {
      const falloff = 1 - ((distance - halfRange) / halfRange);
      damage *= Math.max(falloff, 0.5);
    }

    return damage;
  }

  createBulletTrail(start, end) {
    const points = [start, end];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x00F5FF,
      transparent: true,
      opacity: 0.8
    });

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    // Fade out and remove
    let opacity = 0.8;
    const fadeInterval = setInterval(() => {
      opacity -= 0.1;
      material.opacity = opacity;

      if (opacity <= 0) {
        clearInterval(fadeInterval);
        this.scene.remove(line);
        geometry.dispose();
        material.dispose();
      }
    }, 16);
  }

  createImpactEffect(point) {
    // Create small spark particles
    const particleCount = 5;
    const particles = new THREE.Group();

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 4, 4);
      const material = new THREE.MeshBasicMaterial({ color: 0xFF006E });
      const particle = new THREE.Mesh(geometry, material);

      particle.position.copy(point);
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      );

      particles.add(particle);
      particle.userData.velocity = velocity;
    }

    this.scene.add(particles);

    // Animate particles
    let life = 0.3;
    const animateInterval = setInterval(() => {
      life -= 0.016;

      particles.children.forEach(particle => {
        particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
        particle.userData.velocity.y -= 9.81 * 0.016;
      });

      if (life <= 0) {
        clearInterval(animateInterval);
        this.scene.remove(particles);
        particles.children.forEach(particle => {
          particle.geometry.dispose();
          particle.material.dispose();
        });
      }
    }, 16);
  }

  update(deltaTime) {
    // Clean up old projectiles
    this.projectiles = this.projectiles.filter(p => p.life > 0);
  }
}
