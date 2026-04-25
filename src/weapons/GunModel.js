import * as THREE from 'three';
import { NeonMaterials } from '../environment/NeonMaterials.js';

export class GunModel {
  constructor(camera) {
    this.camera = camera;
    this.group = new THREE.Group();

    // Position in front of camera (bottom right)
    this.basePosition = new THREE.Vector3(0.3, -0.3, -0.6);
    this.baseRotation = new THREE.Euler(0, 0, 0);

    // Animation state
    this.recoilOffset = new THREE.Vector3();
    this.recoilRotation = new THREE.Euler();
    this.reloadProgress = 0;
    this.isReloading = false;

    // Movement sway
    this.swayTime = 0;
    this.swayIntensity = 0.02;
    this.bobIntensity = 0.03;

    // Add to camera
    this.camera.add(this.group);
  }

  updateSway(deltaTime, isMoving) {
    if (isMoving) {
      this.swayTime += deltaTime * 10;

      // Bob up and down
      const bobOffset = Math.sin(this.swayTime) * this.bobIntensity;
      this.group.position.y = this.basePosition.y + bobOffset + this.recoilOffset.y;

      // Sway side to side
      const swayOffset = Math.sin(this.swayTime * 0.5) * this.swayIntensity;
      this.group.position.x = this.basePosition.x + swayOffset + this.recoilOffset.x;
    } else {
      // Smoothly return to base position when not moving
      this.swayTime = 0;
    }
  }

  update(deltaTime, isMoving = false) {
    // Smooth recoil recovery
    this.recoilOffset.multiplyScalar(0.85);
    this.recoilRotation.x *= 0.85;
    this.recoilRotation.y *= 0.85;
    this.recoilRotation.z *= 0.85;

    // Update base position
    this.group.position.copy(this.basePosition).add(this.recoilOffset);

    // Update sway based on movement
    this.updateSway(deltaTime, isMoving);

    // Update rotation
    this.group.rotation.copy(this.baseRotation);
    this.group.rotation.x += this.recoilRotation.x;
    this.group.rotation.y += this.recoilRotation.y;
    this.group.rotation.z += this.recoilRotation.z;

    // Reload animation
    if (this.isReloading) {
      this.reloadProgress += deltaTime * 2;

      // Move gun down and to the side during reload
      const progress = Math.min(this.reloadProgress, 1);
      const reloadAnim = Math.sin(progress * Math.PI);

      this.group.position.y = this.basePosition.y - reloadAnim * 0.3;
      this.group.rotation.z = reloadAnim * 0.5;

      if (this.reloadProgress >= 1) {
        this.isReloading = false;
        this.reloadProgress = 0;
      }
    }
  }

  playFireAnimation() {
    // Recoil kick
    this.recoilOffset.set(0, 0, 0.05);
    this.recoilRotation.x = -0.1;

    // Flash the emissive materials
    this.group.traverse((child) => {
      if (child.material && child.material.emissive) {
        const originalIntensity = child.material.emissiveIntensity;
        child.material.emissiveIntensity = 5;

        setTimeout(() => {
          child.material.emissiveIntensity = originalIntensity;
        }, 50);
      }
    });
  }

  playReloadAnimation() {
    this.isReloading = true;
    this.reloadProgress = 0;
  }

  remove() {
    this.camera.remove(this.group);

    // Dispose geometries and materials
    this.group.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
    });
  }
}

export class PistolModel extends GunModel {
  constructor(camera) {
    super(camera);
    this.createModel();
  }

  createModel() {
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.9,
      roughness: 0.2
    });

    const neonMaterial = NeonMaterials.createNeonTrim(0x00F5FF);

    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
    const barrel = new THREE.Mesh(barrelGeometry, baseMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.15, 0, 0);
    this.group.add(barrel);

    // Slide
    const slideGeometry = new THREE.BoxGeometry(0.25, 0.08, 0.08);
    const slide = new THREE.Mesh(slideGeometry, baseMaterial);
    slide.position.set(0.05, 0.02, 0);
    this.group.add(slide);

    // Grip
    const gripGeometry = new THREE.BoxGeometry(0.06, 0.15, 0.08);
    const grip = new THREE.Mesh(gripGeometry, baseMaterial);
    grip.position.set(-0.08, -0.05, 0);
    this.group.add(grip);

    // Neon accents
    const accentGeometry = new THREE.BoxGeometry(0.25, 0.01, 0.01);
    const accent1 = new THREE.Mesh(accentGeometry, neonMaterial);
    accent1.position.set(0.05, 0.06, 0);
    this.group.add(accent1);

    const accent2 = new THREE.Mesh(accentGeometry, neonMaterial);
    accent2.position.set(0.05, 0.06, 0.04);
    this.group.add(accent2);

    // Muzzle glow
    const muzzleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
    const muzzleGlow = new THREE.Mesh(muzzleGeometry, neonMaterial);
    muzzleGlow.position.set(0.3, 0, 0);
    this.group.add(muzzleGlow);
  }
}

export class RifleModel extends GunModel {
  constructor(camera) {
    super(camera);
    this.createModel();
  }

  createModel() {
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.9,
      roughness: 0.3
    });

    const neonMaterial = NeonMaterials.createNeonTrim(0xFF006E);

    // Barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.025, 0.025, 0.5, 8);
    const barrel = new THREE.Mesh(barrelGeometry, baseMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.2, 0, 0);
    this.group.add(barrel);

    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.35, 0.12, 0.1);
    const body = new THREE.Mesh(bodyGeometry, baseMaterial);
    body.position.set(0, 0, 0);
    this.group.add(body);

    // Stock
    const stockGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.08);
    const stock = new THREE.Mesh(stockGeometry, baseMaterial);
    stock.position.set(-0.25, 0.02, 0);
    this.group.add(stock);

    // Magazine
    const magGeometry = new THREE.BoxGeometry(0.08, 0.2, 0.06);
    const mag = new THREE.Mesh(magGeometry, baseMaterial);
    mag.position.set(0, -0.15, 0);
    this.group.add(mag);

    // Neon rails
    const railGeometry = new THREE.BoxGeometry(0.4, 0.01, 0.01);
    const rail1 = new THREE.Mesh(railGeometry, neonMaterial);
    rail1.position.set(0.05, 0.065, 0.035);
    this.group.add(rail1);

    const rail2 = new THREE.Mesh(railGeometry, neonMaterial);
    rail2.position.set(0.05, 0.065, -0.035);
    this.group.add(rail2);

    // Muzzle brake
    const muzzleGeometry = new THREE.CylinderGeometry(0.04, 0.03, 0.05, 6);
    const muzzle = new THREE.Mesh(muzzleGeometry, neonMaterial);
    muzzle.rotation.z = Math.PI / 2;
    muzzle.position.set(0.475, 0, 0);
    this.group.add(muzzle);
  }
}

export class ShotgunModel extends GunModel {
  constructor(camera) {
    super(camera);
    this.createModel();
  }

  createModel() {
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.8,
      roughness: 0.4
    });

    const neonMaterial = NeonMaterials.createNeonTrim(0x8B00FF);

    // Double barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8);

    const barrel1 = new THREE.Mesh(barrelGeometry, baseMaterial);
    barrel1.rotation.z = Math.PI / 2;
    barrel1.position.set(0.15, 0.03, 0);
    this.group.add(barrel1);

    const barrel2 = new THREE.Mesh(barrelGeometry.clone(), baseMaterial);
    barrel2.rotation.z = Math.PI / 2;
    barrel2.position.set(0.15, -0.03, 0);
    this.group.add(barrel2);

    // Body
    const bodyGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.12);
    const body = new THREE.Mesh(bodyGeometry, baseMaterial);
    body.position.set(-0.05, 0, 0);
    this.group.add(body);

    // Stock
    const stockGeometry = new THREE.BoxGeometry(0.2, 0.12, 0.1);
    const stock = new THREE.Mesh(stockGeometry, baseMaterial);
    stock.position.set(-0.3, 0.05, 0);
    this.group.add(stock);

    // Pump grip
    const gripGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.1);
    const grip = new THREE.Mesh(gripGeometry, neonMaterial);
    grip.position.set(0.1, -0.1, 0);
    this.group.add(grip);

    // Neon stripes
    const stripeGeometry = new THREE.BoxGeometry(0.3, 0.015, 0.015);
    const stripe1 = new THREE.Mesh(stripeGeometry, neonMaterial);
    stripe1.position.set(-0.05, 0.08, 0);
    this.group.add(stripe1);

    // Muzzle rings
    const ringGeometry = new THREE.TorusGeometry(0.05, 0.01, 8, 12);
    const ring1 = new THREE.Mesh(ringGeometry, neonMaterial);
    ring1.rotation.y = Math.PI / 2;
    ring1.position.set(0.35, 0.03, 0);
    this.group.add(ring1);

    const ring2 = new THREE.Mesh(ringGeometry.clone(), neonMaterial);
    ring2.rotation.y = Math.PI / 2;
    ring2.position.set(0.35, -0.03, 0);
    this.group.add(ring2);
  }
}

export class SniperModel extends GunModel {
  constructor(camera) {
    super(camera);
    this.createModel();
  }

  createModel() {
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d0d1a,
      metalness: 1,
      roughness: 0.2
    });

    const neonMaterial = NeonMaterials.createNeonTrim(0x00F5FF);

    // Long barrel
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.03, 0.6, 8);
    const barrel = new THREE.Mesh(barrelGeometry, baseMaterial);
    barrel.rotation.z = Math.PI / 2;
    barrel.position.set(0.25, 0, 0);
    this.group.add(barrel);

    // Body/Receiver
    const bodyGeometry = new THREE.BoxGeometry(0.25, 0.1, 0.12);
    const body = new THREE.Mesh(bodyGeometry, baseMaterial);
    body.position.set(-0.05, 0, 0);
    this.group.add(body);

    // Scope
    const scopeBodyGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.25, 8);
    const scopeBody = new THREE.Mesh(scopeBodyGeometry, baseMaterial);
    scopeBody.rotation.z = Math.PI / 2;
    scopeBody.position.set(0.025, 0.08, 0);
    this.group.add(scopeBody);

    // Scope lens
    const lensGeometry = new THREE.CircleGeometry(0.03, 8);
    const lensMaterial = NeonMaterials.createNeonTrim(0x00F5FF);
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    lens.position.set(0.15, 0.08, 0);
    this.group.add(lens);

    // Stock
    const stockGeometry = new THREE.BoxGeometry(0.25, 0.08, 0.1);
    const stock = new THREE.Mesh(stockGeometry, baseMaterial);
    stock.position.set(-0.3, 0.03, 0);
    this.group.add(stock);

    // Bipod
    const bipodGeometry = new THREE.CylinderGeometry(0.005, 0.005, 0.15, 6);
    const bipod1 = new THREE.Mesh(bipodGeometry, neonMaterial);
    bipod1.position.set(0.15, -0.1, 0.05);
    bipod1.rotation.x = 0.3;
    this.group.add(bipod1);

    const bipod2 = new THREE.Mesh(bipodGeometry.clone(), neonMaterial);
    bipod2.position.set(0.15, -0.1, -0.05);
    bipod2.rotation.x = -0.3;
    this.group.add(bipod2);

    // Neon accents
    const accentGeometry = new THREE.BoxGeometry(0.5, 0.01, 0.01);
    const accent = new THREE.Mesh(accentGeometry, neonMaterial);
    accent.position.set(0.15, 0.055, 0);
    this.group.add(accent);

    // Muzzle device
    const muzzleGeometry = new THREE.CylinderGeometry(0.05, 0.04, 0.08, 6);
    const muzzle = new THREE.Mesh(muzzleGeometry, neonMaterial);
    muzzle.rotation.z = Math.PI / 2;
    muzzle.position.set(0.58, 0, 0);
    this.group.add(muzzle);
  }
}
