import * as THREE from 'three';
import EventBus from '../utils/EventBus.js';

export class ProjectileSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.projectiles = [];
    this.raycaster = new THREE.Raycaster();
    this.screenShakeIntensity = 0;
    this.screenShakeDecay = 0;
  }

  fireBullet(origin, direction, weaponData, enemies, buildingMeshes = []) {
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

      // Check hits against buildings FIRST (so bullets can't shoot through them)
      const buildingHits = this.raycaster.intersectObjects(buildingMeshes, true);

      if (buildingHits.length > 0) {
        // Hit a building - bullet stops here
        const hit = buildingHits[0];
        results.push({
          hit: true,
          point: hit.point,
          distance: hit.distance,
          object: hit.object,
          damage: 0, // Buildings don't take damage
          hitBuilding: true
        });

        // Create impact effect at hit point
        this.createImpactEffect(hit.point);

        // Create visual bullet trail to building hit
        this.createBulletTrail(origin, hit.point);
        continue; // Don't check enemies - bullet was stopped by building
      }

      // Check hits against enemies (only if didn't hit a building)
      const hits = this.raycaster.intersectObjects(enemies, true);

      if (hits.length > 0) {
        const hit = hits[0];
        const isHeadshot = hit.object.userData.isHead === true;
        const baseDamage = this.calculateDamage(weaponData, hit.distance);
        const finalDamage = isHeadshot ? baseDamage * 2.0 : baseDamage; // 2x damage for headshots

        results.push({
          hit: true,
          point: hit.point,
          distance: hit.distance,
          object: hit.object,
          damage: finalDamage,
          isHeadshot: isHeadshot,
          hitBuilding: false
        });

        // Create impact effect at hit point
        this.createImpactEffect(hit.point);

        // Create visual bullet trail to enemy hit
        this.createBulletTrail(origin, hit.point);
      } else {
        // Miss - create bullet trail
        const endPoint = origin.clone().add(spreadDir.multiplyScalar(weaponData.range));
        results.push({
          hit: false,
          point: endPoint,
          distance: weaponData.range,
          hitBuilding: false
        });

        // Create visual bullet trail for miss
        this.createBulletTrail(origin, endPoint);
      }
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
    // Simplified - reduced geometry complexity and faster fade
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    direction.normalize();

    const geometry = new THREE.CylinderGeometry(0.01, 0.01, length, 4); // Reduced segments
    const material = new THREE.MeshBasicMaterial({
      color: 0x00F5FF,
      transparent: true,
      opacity: 0.6 // Reduced opacity
    });

    const laser = new THREE.Mesh(geometry, material);
    const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    laser.position.copy(midpoint);
    laser.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
    this.scene.add(laser);

    // Faster fade - only 2 frames
    setTimeout(() => {
      material.opacity = 0.3;
      setTimeout(() => {
        this.scene.remove(laser);
        geometry.dispose();
        material.dispose();
      }, 16);
    }, 16);
  }

  createImpactEffect(point) {
    // Reduced to 2 particles only
    const particleCount = 2;
    const particles = new THREE.Group();

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.05, 4, 4); // Lower poly
      const material = new THREE.MeshBasicMaterial({
        color: 0x00F5FF,
        transparent: true,
        opacity: 0.8
      });
      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(point);

      const speed = 2;
      particle.userData.velocity = new THREE.Vector3(
        (Math.random() - 0.5) * speed,
        Math.random() * speed * 0.5,
        (Math.random() - 0.5) * speed
      );
      particles.add(particle);
    }

    this.scene.add(particles);

    // Shorter animation - 0.2s instead of 0.4s
    let life = 0.2;
    const animateInterval = setInterval(() => {
      life -= 0.05;

      particles.children.forEach(particle => {
        particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.05));
        particle.material.opacity = life / 0.2;
      });

      if (life <= 0) {
        clearInterval(animateInterval);
        this.scene.remove(particles);
        particles.children.forEach(particle => {
          particle.geometry.dispose();
          particle.material.dispose();
        });
      }
    }, 50);
  }

  createMuzzleFlash(position, direction) {
    // Ultra simple - just a small flash, no light
    const flashGeometry = new THREE.SphereGeometry(0.15, 4, 4); // Lower poly
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFF00,
      transparent: true,
      opacity: 0.7
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    this.scene.add(flash);

    // Very quick removal - 30ms
    setTimeout(() => {
      this.scene.remove(flash);
      flashGeometry.dispose();
      flashMaterial.dispose();
    }, 30);
  }

  createShellCasing(position, direction) {
    // Disabled - shell casings removed for performance
    // Too expensive to animate individual shells
  }

  addScreenShake(intensity) {
    this.screenShakeIntensity = Math.max(this.screenShakeIntensity, intensity);
    this.screenShakeDecay = intensity * 10;
  }

  update(deltaTime) {
    // Clean up old projectiles
    this.projectiles = this.projectiles.filter(p => p.life > 0);

    // Apply screen shake
    if (this.screenShakeIntensity > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
      const shakeY = (Math.random() - 0.5) * this.screenShakeIntensity;

      if (this.camera && this.camera.rotation) {
        this.camera.rotation.x += shakeX;
        this.camera.rotation.z += shakeY * 0.5;
      }

      this.screenShakeIntensity -= this.screenShakeDecay * deltaTime;
      if (this.screenShakeIntensity < 0) {
        this.screenShakeIntensity = 0;
      }
    }
  }
}
