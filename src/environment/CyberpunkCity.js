import * as THREE from 'three';

export class CyberpunkCity {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.buildingColliders = []; // Store collision boxes for buildings
  }

  generate() {
    console.log('Generating optimized buildings...');

    // Reduced to 30 buildings for better performance
    for (let i = 0; i < 30; i++) {
      // Random position
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;

      // Skip if too close to center (player spawn)
      if (Math.sqrt(x * x + z * z) < 15) continue;

      // Random size
      const width = 5 + Math.random() * 10;
      const height = 15 + Math.random() * 40;
      const depth = 5 + Math.random() * 10;

      // Optimized black material with better performance
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshStandardMaterial({
        color: 0x000000,
        metalness: 0.5,           // Reduced from 0.7
        roughness: 0.4,           // Increased from 0.3
        emissive: 0x001a33,
        emissiveIntensity: 0.1    // Reduced from 0.15
      });

      const building = new THREE.Mesh(geometry, material);
      building.position.set(x, height / 2, z);
      building.castShadow = false;      // Disabled for performance
      building.receiveShadow = false;   // Disabled for performance

      this.scene.add(building);
      this.buildings.push(building);

      // Store collision box for this building
      this.buildingColliders.push({
        x: x,
        z: z,
        width: width,
        height: height,
        depth: depth,
        minX: x - width / 2,
        maxX: x + width / 2,
        minZ: z - depth / 2,
        maxZ: z + depth / 2,
        minY: 0,
        maxY: height,
        mesh: building // Store reference to mesh for raycasting
      });

      // Only add light every other building to reduce light count
      if (i % 2 === 0) {
        const light = new THREE.PointLight(0x00ffff, 1.2, 30);
        light.position.set(x, height + 2, z);
        this.scene.add(light);
      }

      // Only add 2 strips instead of 4 for better performance
      const stripColor = 0x00ffff;
      const stripMaterial = new THREE.MeshBasicMaterial({
        color: stripColor,
        fog: false
      });

      for (let j = 0; j < 2; j++) {
        const stripGeometry = new THREE.BoxGeometry(0.12, height, 0.12);
        const strip = new THREE.Mesh(stripGeometry, stripMaterial);

        const angle = (j / 2) * Math.PI;
        const offsetX = Math.cos(angle) * (width / 2);
        const offsetZ = Math.sin(angle) * (depth / 2);

        strip.position.set(x + offsetX, height / 2, z + offsetZ);
        this.scene.add(strip);
        this.buildings.push(strip);
      }
    }

    console.log('Created', this.buildings.length, 'objects');
  }

  update(deltaTime) {
    // Nothing to update for simple buildings
  }

  // Get collision data for player controller and projectile system
  getBuildingColliders() {
    return this.buildingColliders;
  }

  // Get building meshes for raycasting
  getBuildingMeshes() {
    return this.buildings.filter(b => b.type === 'Mesh');
  }

  dispose() {
    this.buildings.forEach(building => {
      building.geometry.dispose();
      building.material.dispose();
      this.scene.remove(building);
    });
    this.buildings = [];
    this.buildingColliders = [];
  }
}
