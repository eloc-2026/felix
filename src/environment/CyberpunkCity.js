import * as THREE from 'three';
import { Config } from '../utils/Config.js';
import { NeonMaterials } from './NeonMaterials.js';

export class CyberpunkCity {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.neonLights = [];
    this.colors = [
      Config.COLORS.NEON_PINK,
      Config.COLORS.NEON_CYAN,
      Config.COLORS.NEON_PURPLE
    ];
  }

  generate() {
    const worldSize = Config.WORLD_SIZE;
    const buildingCount = Config.BUILDING_COUNT;
    const minDist = 15; // Minimum distance from center (player spawn)

    for (let i = 0; i < buildingCount; i++) {
      let x, z;
      let attempts = 0;

      // Find position far enough from center
      do {
        x = (Math.random() - 0.5) * worldSize * 0.8;
        z = (Math.random() - 0.5) * worldSize * 0.8;
        attempts++;
      } while (Math.sqrt(x * x + z * z) < minDist && attempts < 50);

      const width = 4 + Math.random() * 6;
      const height = 10 + Math.random() * 30;
      const depth = 4 + Math.random() * 6;

      this.createBuilding(x, z, width, height, depth);
    }

    // Add some decorative neon structures near center
    this.addCentralStructures();
  }

  createBuilding(x, z, width, height, depth) {
    const building = new THREE.Group();

    // Main building body
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const bodyMaterial = NeonMaterials.createBuildingMaterial();
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = height / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    building.add(bodyMesh);

    // Random neon color for this building
    const neonColor = this.colors[Math.floor(Math.random() * this.colors.length)];
    const trimMaterial = NeonMaterials.createNeonTrim(neonColor);

    // Add neon strips (vertical lines)
    const stripCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < stripCount; i++) {
      const stripGeometry = new THREE.BoxGeometry(0.2, height, 0.2);
      const strip = new THREE.Mesh(stripGeometry, trimMaterial);

      const angle = (i / stripCount) * Math.PI * 2;
      const radius = Math.min(width, depth) / 2;
      strip.position.set(
        Math.cos(angle) * radius,
        height / 2,
        Math.sin(angle) * radius
      );

      building.add(strip);

      // Add point light at strip
      const light = new THREE.PointLight(neonColor, 0.5, 20);
      light.position.copy(strip.position);
      building.add(light);
      this.neonLights.push(light);
    }

    // Top neon ring
    const ringGeometry = new THREE.TorusGeometry(Math.min(width, depth) / 2, 0.15, 8, 16);
    const ring = new THREE.Mesh(ringGeometry, trimMaterial);
    ring.position.y = height;
    ring.rotation.x = Math.PI / 2;
    building.add(ring);

    // Top light
    const topLight = new THREE.PointLight(neonColor, 1, 30);
    topLight.position.y = height;
    building.add(topLight);
    this.neonLights.push(topLight);

    building.position.set(x, 0, z);
    this.scene.add(building);
    this.buildings.push(building);
  }

  addCentralStructures() {
    // Add some neon pillars around the spawn area
    const pillarPositions = [
      [-10, -10], [10, -10], [-10, 10], [10, 10]
    ];

    pillarPositions.forEach(([x, z], i) => {
      const color = this.colors[i % this.colors.length];
      const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
      const pillarMaterial = NeonMaterials.createNeonTrim(color);
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(x, 7.5, z);
      this.scene.add(pillar);

      // Add light to pillar
      const light = new THREE.PointLight(color, 1.5, 25);
      light.position.set(x, 10, z);
      this.scene.add(light);
      this.neonLights.push(light);
    });
  }

  update(deltaTime) {
    // Animate neon lights (pulsing effect)
    const time = performance.now() * 0.001;
    this.neonLights.forEach((light, i) => {
      const offset = i * 0.5;
      light.intensity *= 0.95 + Math.sin(time * 2 + offset) * 0.05;
    });
  }

  dispose() {
    this.buildings.forEach(building => {
      this.scene.remove(building);
    });
    this.buildings = [];
    this.neonLights = [];
  }
}
