import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
  }

  createMuzzleFlash(position, direction) {
    // Create bright flash at gun muzzle
    const flashGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const flashMaterial = new THREE.MeshBasicMaterial({
      color: 0xFFFF00,
      transparent: true,
      opacity: 1
    });

    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.copy(position);
    flash.position.add(direction.clone().multiplyScalar(0.5));

    this.scene.add(flash);

    // Quick fade out
    let opacity = 1;
    const fadeInterval = setInterval(() => {
      opacity -= 0.2;
      flashMaterial.opacity = opacity;

      if (opacity <= 0) {
        clearInterval(fadeInterval);
        this.scene.remove(flash);
        flashGeometry.dispose();
        flashMaterial.dispose();
      }
    }, 16);
  }

  createExplosion(position, color = 0xFF006E) {
    const particleCount = 15;
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 6, 6);
      const material = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 1
      });

      const particle = new THREE.Mesh(geometry, material);
      particle.position.copy(position);

      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 5,
        Math.random() * 5,
        (Math.random() - 0.5) * 5
      );

      particle.userData.velocity = velocity;
      particles.push(particle);
      this.scene.add(particle);
    }

    // Animate explosion
    let life = 0.5;
    const animateInterval = setInterval(() => {
      life -= 0.016;

      particles.forEach(particle => {
        particle.position.add(particle.userData.velocity.clone().multiplyScalar(0.016));
        particle.userData.velocity.y -= 9.81 * 0.016;
        particle.material.opacity = life / 0.5;
      });

      if (life <= 0) {
        clearInterval(animateInterval);
        particles.forEach(particle => {
          this.scene.remove(particle);
          particle.geometry.dispose();
          particle.material.dispose();
        });
      }
    }, 16);
  }
}
