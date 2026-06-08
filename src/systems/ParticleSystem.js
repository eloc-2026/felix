import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
  }

  createMuzzleFlash(position, direction) {
    // Simplified - single flash, no glow, instant removal
    const flashGeometry = new THREE.SphereGeometry(0.1, 4, 4); // Lower poly
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFAA00,
      transparent: true,
      opacity: 0.6
    });

    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    flash.position.add(direction.clone().multiplyScalar(0.3));
    this.scene.add(flash);

    // Very quick removal - 20ms
    setTimeout(() => {
      this.scene.remove(flash);
      flashGeometry.dispose();
      flashMaterial.dispose();
    }, 20);
  }

  createExplosion(position, color = 0xFF006E) {
    // Reduced to 4 particles for performance
    const particleCount = 4;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.08, 4, 4); // Lower poly
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.8
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 3,
        Math.random() * 3,
        (Math.random() - 0.5) * 3
      );

      particle.userData.velocity = velocity;
      particles.push(particle);
      this.scene.add(particle);
    }

    // Shorter animation - 0.3s instead of 0.5s
    let life = 0.3;
    const animateInterval = setInterval(() => {
      life -= 0.05;

      particles.forEach(particle => {
        particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.05));
        particle.userData.velocity.y -= 9.81 * 0.05;
        particle.material.opacity = life / 0.3;
      });

      if (life <= 0) {
        clearInterval(animateInterval);
        particles.forEach(particle => {
          this.scene.remove(particle);
          particle.geometry.dispose();
          particle.material.dispose();
        });
      }
    }, 50);
  }
}
