import * as THREE from 'three';
import { Config } from '../utils/Config.js';
import { NeonMaterials } from './NeonMaterials.js';

export class MapManager {
  constructor(scene) {
    this.scene = scene;
    this.buildings = [];
    this.buildingColliders = []; // Store collision boxes for buildings
    this.neonLights = [];
    this.currentMap = 'cyberpunk';
  }

  loadMap(mapType) {
    this.clearMap();
    this.currentMap = mapType;

    console.log('MapManager.loadMap called with:', mapType);
    // Map loading is now handled by CyberpunkCity in Game.js
    // This just clears colliders for map switching
  }

  generateCyberpunkCity() {
    console.log('Generating Cyberpunk City with', Config.BUILDING_COUNT, 'buildings');
    const colors = [
      Config.COLORS.NEON_PINK,
      Config.COLORS.NEON_CYAN,
      Config.COLORS.NEON_PURPLE
    ];

    const worldSize = Config.WORLD_SIZE;
    const buildingCount = Config.BUILDING_COUNT;
    const minDist = 12;

    // Create variety of building types
    for (let i = 0; i < buildingCount; i++) {
      let x, z;
      let attempts = 0;

      do {
        x = (Math.random() - 0.5) * worldSize * 0.85;
        z = (Math.random() - 0.5) * worldSize * 0.85;
        attempts++;
      } while (Math.sqrt(x * x + z * z) < minDist && attempts < 50);

      const buildingType = Math.random();
      const color = colors[Math.floor(Math.random() * colors.length)];

      if (buildingType < 0.4) {
        // Standard tall building
        const width = 4 + Math.random() * 8;
        const height = 15 + Math.random() * 45;
        const depth = 4 + Math.random() * 8;
        this.createStandardBuilding(x, z, width, height, depth, color);
      } else if (buildingType < 0.65) {
        // Skyscraper
        const width = 5 + Math.random() * 6;
        const height = 35 + Math.random() * 55;
        const depth = 5 + Math.random() * 6;
        this.createSkyscraper(x, z, width, height, depth, color);
      } else if (buildingType < 0.85) {
        // Wide building
        const width = 8 + Math.random() * 12;
        const height = 8 + Math.random() * 25;
        const depth = 8 + Math.random() * 12;
        this.createWideBuilding(x, z, width, height, depth, color);
      } else {
        // L-shaped building
        this.createLShapedBuilding(x, z, color);
      }
    }

    this.addCentralPillars(colors);
    this.addFloatingPlatforms(colors);
    this.addBillboards(colors);
    this.addStreetLights(colors);
  }

  generateNeonDistrict() {
    // More colorful, taller buildings
    const colors = [
      Config.COLORS.NEON_PINK,
      Config.COLORS.NEON_CYAN,
      Config.COLORS.NEON_PURPLE,
      0x00FF00, // Green
      0xFFFF00  // Yellow
    ];

    const worldSize = Config.WORLD_SIZE;
    const buildingCount = Config.BUILDING_COUNT + 20;
    const minDist = 12;

    for (let i = 0; i < buildingCount; i++) {
      let x, z;
      let attempts = 0;

      do {
        x = (Math.random() - 0.5) * worldSize * 0.9;
        z = (Math.random() - 0.5) * worldSize * 0.9;
        attempts++;
      } while (Math.sqrt(x * x + z * z) < minDist && attempts < 50);

      const buildingType = Math.random();
      const color = colors[Math.floor(Math.random() * colors.length)];

      if (buildingType < 0.5) {
        const width = 3 + Math.random() * 5;
        const height = 20 + Math.random() * 50;
        const depth = 3 + Math.random() * 5;
        this.createNeonBuilding(x, z, width, height, depth, color);
      } else {
        const width = 4 + Math.random() * 6;
        const height = 25 + Math.random() * 60;
        const depth = 4 + Math.random() * 6;
        this.createSkyscraper(x, z, width, height, depth, color);
      }
    }

    this.addNeonRings(colors);
    this.addFloatingPlatforms(colors);
    this.addBillboards(colors);
  }

  generateIndustrialZone() {
    // Darker, more industrial with red and orange lights
    const colors = [
      0xFF4500, // Orange red
      0xFF6347, // Tomato
      0xFFFF00  // Yellow
    ];

    const worldSize = Config.WORLD_SIZE;
    const buildingCount = Config.BUILDING_COUNT + 10;
    const minDist = 12;

    for (let i = 0; i < buildingCount; i++) {
      let x, z;
      let attempts = 0;

      do {
        x = (Math.random() - 0.5) * worldSize * 0.85;
        z = (Math.random() - 0.5) * worldSize * 0.85;
        attempts++;
      } while (Math.sqrt(x * x + z * z) < minDist && attempts < 50);

      const buildingType = Math.random();
      const color = colors[Math.floor(Math.random() * colors.length)];

      if (buildingType < 0.6) {
        const width = 8 + Math.random() * 10;
        const height = 8 + Math.random() * 22;
        const depth = 8 + Math.random() * 10;
        this.createWideBuilding(x, z, width, height, depth, color);
      } else {
        const width = 6 + Math.random() * 8;
        const height = 10 + Math.random() * 25;
        const depth = 6 + Math.random() * 8;
        this.createIndustrialBuilding(x, z, width, height, depth, color);
      }
    }

    this.addIndustrialStacks(colors);
    this.addStreetLights(colors);
  }

  generateDowntown() {
    // Grid-based layout with purple and blue
    const colors = [
      Config.COLORS.NEON_PURPLE,
      Config.COLORS.NEON_CYAN,
      0x4B0082  // Indigo
    ];

    const spacing = 22;
    const gridSize = 6;

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        if (Math.abs(i) < 1 && Math.abs(j) < 1) continue; // Skip center

        const x = i * spacing + (Math.random() - 0.5) * 4;
        const z = j * spacing + (Math.random() - 0.5) * 4;
        const buildingType = Math.random();
        const color = colors[Math.floor(Math.random() * colors.length)];

        if (buildingType < 0.5) {
          const width = 5 + Math.random() * 5;
          const height = 15 + Math.random() * 35;
          const depth = 5 + Math.random() * 5;
          this.createStandardBuilding(x, z, width, height, depth, color);
        } else {
          const width = 5 + Math.random() * 4;
          const height = 20 + Math.random() * 45;
          const depth = 5 + Math.random() * 4;
          this.createSkyscraper(x, z, width, height, depth, color);
        }
      }
    }

    this.addCentralPillars(colors);
    this.addFloatingPlatforms(colors);
    this.addBillboards(colors);
  }

  createStandardBuilding(x, z, width, height, depth, neonColor) {
    const building = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const bodyMaterial = NeonMaterials.createBuildingMaterial();
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = height / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    building.add(bodyMesh);

    const trimMaterial = NeonMaterials.createNeonTrim(neonColor);
    const stripCount = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < stripCount; i++) {
      const stripGeometry = new THREE.BoxGeometry(0.2, height, 0.2);
      const strip = new THREE.Mesh(stripGeometry, trimMaterial);
      const angle = (i / stripCount) * Math.PI * 2;
      const radius = Math.min(width, depth) / 2;
      strip.position.set(Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius);
      building.add(strip);

      const light = new THREE.PointLight(neonColor, 0.5, 20);
      light.position.copy(strip.position);
      building.add(light);
      this.neonLights.push(light);
    }

    const ringGeometry = new THREE.TorusGeometry(Math.min(width, depth) / 2, 0.15, 8, 16);
    const ring = new THREE.Mesh(ringGeometry, trimMaterial);
    ring.position.y = height;
    ring.rotation.x = Math.PI / 2;
    building.add(ring);

    const topLight = new THREE.PointLight(neonColor, 1, 30);
    topLight.position.y = height;
    building.add(topLight);
    this.neonLights.push(topLight);

    building.position.set(x, 0, z);
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
      maxY: height
    });
  }

  createNeonBuilding(x, z, width, height, depth, neonColor) {
    const building = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const bodyMaterial = NeonMaterials.createBuildingMaterial();
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = height / 2;
    building.add(bodyMesh);

    const trimMaterial = NeonMaterials.createNeonTrim(neonColor);

    // Extra bright vertical strips
    for (let i = 0; i < 6; i++) {
      const stripGeometry = new THREE.BoxGeometry(0.3, height, 0.3);
      const strip = new THREE.Mesh(stripGeometry, trimMaterial);
      const angle = (i / 6) * Math.PI * 2;
      const radius = Math.min(width, depth) / 2;
      strip.position.set(Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius);
      building.add(strip);

      const light = new THREE.PointLight(neonColor, 1, 25);
      light.position.copy(strip.position);
      building.add(light);
      this.neonLights.push(light);
    }

    building.position.set(x, 0, z);
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
      maxY: height
    });
  }

  createIndustrialBuilding(x, z, width, height, depth, neonColor) {
    const building = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      metalness: 0.8,
      roughness: 0.4
    });
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = height / 2;
    building.add(bodyMesh);

    // Fewer, more industrial lights
    const light = new THREE.PointLight(neonColor, 0.8, 25);
    light.position.y = height;
    building.add(light);
    this.neonLights.push(light);

    building.position.set(x, 0, z);
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
      maxY: height
    });
  }

  addCentralPillars(colors) {
    const pillarPositions = [
      [-10, -10], [10, -10], [-10, 10], [10, 10]
    ];

    pillarPositions.forEach(([x, z], i) => {
      const color = colors[i % colors.length];
      const pillarGeometry = new THREE.CylinderGeometry(0.3, 0.3, 15, 8);
      const pillarMaterial = NeonMaterials.createNeonTrim(color);
      const pillar = new THREE.Mesh(pillarGeometry, pillarMaterial);
      pillar.position.set(x, 7.5, z);
      this.scene.add(pillar);

      const light = new THREE.PointLight(color, 1.5, 25);
      light.position.set(x, 10, z);
      this.scene.add(light);
      this.neonLights.push(light);

      // Add collision for pillar (treat as small square)
      const pillarSize = 0.6; // Slightly larger than visual for easier collision
      this.buildingColliders.push({
        x: x,
        z: z,
        width: pillarSize,
        height: 15,
        depth: pillarSize,
        minX: x - pillarSize / 2,
        maxX: x + pillarSize / 2,
        minZ: z - pillarSize / 2,
        maxZ: z + pillarSize / 2,
        minY: 0,
        maxY: 15
      });
    });
  }

  addNeonRings(colors) {
    const ringPositions = [
      [-8, -8], [8, -8], [-8, 8], [8, 8],
      [0, -12], [0, 12], [-12, 0], [12, 0]
    ];

    ringPositions.forEach(([x, z], i) => {
      const color = colors[i % colors.length];
      const ringGeometry = new THREE.TorusGeometry(2, 0.3, 8, 16);
      const ringMaterial = NeonMaterials.createNeonTrim(color);
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(x, 3, z);
      ring.rotation.x = Math.PI / 2;
      this.scene.add(ring);

      const light = new THREE.PointLight(color, 2, 20);
      light.position.set(x, 3, z);
      this.scene.add(light);
      this.neonLights.push(light);
    });
  }

  addIndustrialStacks(colors) {
    const stackPositions = [
      [-12, -12], [12, -12], [-12, 12], [12, 12]
    ];

    stackPositions.forEach(([x, z], i) => {
      const color = colors[i % colors.length];
      const stackGeometry = new THREE.CylinderGeometry(1, 1.5, 20, 8);
      const stackMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        metalness: 0.9,
        roughness: 0.3
      });
      const stack = new THREE.Mesh(stackGeometry, stackMaterial);
      stack.position.set(x, 10, z);
      this.scene.add(stack);

      const light = new THREE.PointLight(color, 1, 30);
      light.position.set(x, 20, z);
      this.scene.add(light);
      this.neonLights.push(light);

      // Add collision for stack (treat as small square at average radius)
      const stackSize = 2.5; // Average of top and bottom radius
      this.buildingColliders.push({
        x: x,
        z: z,
        width: stackSize,
        height: 20,
        depth: stackSize,
        minX: x - stackSize / 2,
        maxX: x + stackSize / 2,
        minZ: z - stackSize / 2,
        maxZ: z + stackSize / 2,
        minY: 0,
        maxY: 20
      });
    });
  }

  createSkyscraper(x, z, width, height, depth, neonColor) {
    const building = new THREE.Group();

    // Main tower
    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const bodyMaterial = NeonMaterials.createBuildingMaterial();
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = height / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    building.add(bodyMesh);

    const trimMaterial = NeonMaterials.createNeonTrim(neonColor);

    // Vertical neon strips along edges
    for (let i = 0; i < 4; i++) {
      const stripGeometry = new THREE.BoxGeometry(0.4, height, 0.4);
      const strip = new THREE.Mesh(stripGeometry, trimMaterial);
      const angle = (i / 4) * Math.PI * 2;
      const radius = Math.min(width, depth) / 2;
      strip.position.set(Math.cos(angle) * radius, height / 2, Math.sin(angle) * radius);
      building.add(strip);

      const light = new THREE.PointLight(neonColor, 0.8, 25);
      light.position.copy(strip.position);
      building.add(light);
      this.neonLights.push(light);
    }

    // Antenna on top
    const antennaGeometry = new THREE.CylinderGeometry(0.1, 0.2, 8, 6);
    const antenna = new THREE.Mesh(antennaGeometry, trimMaterial);
    antenna.position.y = height + 4;
    building.add(antenna);

    const antennaLight = new THREE.PointLight(neonColor, 2, 40);
    antennaLight.position.y = height + 8;
    building.add(antennaLight);
    this.neonLights.push(antennaLight);

    // Horizontal rings at intervals
    const ringCount = Math.floor(height / 15);
    for (let i = 1; i <= ringCount; i++) {
      const ringGeometry = new THREE.TorusGeometry(Math.min(width, depth) / 2 + 0.3, 0.2, 8, 16);
      const ring = new THREE.Mesh(ringGeometry, trimMaterial);
      ring.position.y = (i / (ringCount + 1)) * height;
      ring.rotation.x = Math.PI / 2;
      building.add(ring);
    }

    building.position.set(x, 0, z);
    this.scene.add(building);
    this.buildings.push(building);

    this.buildingColliders.push({
      x, z, width, height, depth,
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2,
      minY: 0,
      maxY: height
    });
  }

  createWideBuilding(x, z, width, height, depth, neonColor) {
    const building = new THREE.Group();

    const bodyGeometry = new THREE.BoxGeometry(width, height, depth);
    const bodyMaterial = NeonMaterials.createBuildingMaterial();
    const bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.position.y = height / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    building.add(bodyMesh);

    const trimMaterial = NeonMaterials.createNeonTrim(neonColor);

    // Grid pattern on building surface
    const gridLines = 4;
    for (let i = 1; i < gridLines; i++) {
      // Horizontal lines
      const hLineGeometry = new THREE.BoxGeometry(width + 0.2, 0.2, 0.2);
      const hLine = new THREE.Mesh(hLineGeometry, trimMaterial);
      hLine.position.set(0, (i / gridLines) * height, depth / 2 + 0.1);
      building.add(hLine);

      // Vertical lines
      const vLineGeometry = new THREE.BoxGeometry(0.2, height, 0.2);
      const vLine = new THREE.Mesh(vLineGeometry, trimMaterial);
      vLine.position.set(((i / gridLines) - 0.5) * width, height / 2, depth / 2 + 0.1);
      building.add(vLine);
    }

    // Rooftop lights
    for (let i = 0; i < 6; i++) {
      const light = new THREE.PointLight(neonColor, 0.6, 20);
      const angle = (i / 6) * Math.PI * 2;
      const radius = Math.min(width, depth) / 3;
      light.position.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      building.add(light);
      this.neonLights.push(light);
    }

    building.position.set(x, 0, z);
    this.scene.add(building);
    this.buildings.push(building);

    this.buildingColliders.push({
      x, z, width, height, depth,
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2,
      minY: 0,
      maxY: height
    });
  }

  createLShapedBuilding(x, z, neonColor) {
    const building = new THREE.Group();
    const trimMaterial = NeonMaterials.createNeonTrim(neonColor);

    // Part 1 - Vertical section
    const width1 = 6 + Math.random() * 4;
    const height1 = 15 + Math.random() * 25;
    const depth1 = 6 + Math.random() * 4;

    const body1Geometry = new THREE.BoxGeometry(width1, height1, depth1);
    const bodyMaterial = NeonMaterials.createBuildingMaterial();
    const body1Mesh = new THREE.Mesh(body1Geometry, bodyMaterial);
    body1Mesh.position.set(-width1 / 2, height1 / 2, 0);
    body1Mesh.castShadow = true;
    body1Mesh.receiveShadow = true;
    building.add(body1Mesh);

    // Part 2 - Horizontal section
    const width2 = 6 + Math.random() * 4;
    const height2 = 10 + Math.random() * 15;
    const depth2 = 6 + Math.random() * 4;

    const body2Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(width2, height2, depth2),
      bodyMaterial
    );
    body2Mesh.position.set(width2 / 2, height2 / 2, -depth2 / 2);
    body2Mesh.castShadow = true;
    body2Mesh.receiveShadow = true;
    building.add(body2Mesh);

    // Add neon accents
    const accentGeometry = new THREE.BoxGeometry(0.3, height1, 0.3);
    const accent = new THREE.Mesh(accentGeometry, trimMaterial);
    accent.position.set(-width1, height1 / 2, 0);
    building.add(accent);

    const light = new THREE.PointLight(neonColor, 1, 25);
    light.position.set(0, Math.max(height1, height2), 0);
    building.add(light);
    this.neonLights.push(light);

    building.position.set(x, 0, z);
    this.scene.add(building);
    this.buildings.push(building);

    // Add colliders for both parts
    this.buildingColliders.push({
      x: x - width1 / 2,
      z: z,
      width: width1,
      height: height1,
      depth: depth1,
      minX: x - width1 - width1 / 2,
      maxX: x,
      minZ: z - depth1 / 2,
      maxZ: z + depth1 / 2,
      minY: 0,
      maxY: height1
    });

    this.buildingColliders.push({
      x: x + width2 / 2,
      z: z - depth2 / 2,
      width: width2,
      height: height2,
      depth: depth2,
      minX: x,
      maxX: x + width2 + width2 / 2,
      minZ: z - depth2,
      maxZ: z,
      minY: 0,
      maxY: height2
    });
  }

  addFloatingPlatforms(colors) {
    const platformCount = 12;

    for (let i = 0; i < platformCount; i++) {
      const angle = (i / platformCount) * Math.PI * 2;
      const radius = 30 + Math.random() * 30;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 8 + Math.random() * 12;

      const platformGeometry = new THREE.BoxGeometry(4, 0.5, 4);
      const color = colors[i % colors.length];
      const platformMaterial = NeonMaterials.createNeonTrim(color);
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(x, height, z);
      this.scene.add(platform);
      this.buildings.push(platform);

      const light = new THREE.PointLight(color, 1.5, 20);
      light.position.set(x, height, z);
      this.scene.add(light);
      this.neonLights.push(light);

      // Small support beam
      const beamGeometry = new THREE.CylinderGeometry(0.2, 0.2, height, 6);
      const beamMaterial = NeonMaterials.createBuildingMaterial();
      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.set(x, height / 2, z);
      this.scene.add(beam);
      this.buildings.push(beam);
    }
  }

  addBillboards(colors) {
    const billboardCount = 20;

    for (let i = 0; i < billboardCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 40 + Math.random() * 40;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const height = 15 + Math.random() * 20;

      const billboardGeometry = new THREE.PlaneGeometry(3, 2);
      const color = colors[i % colors.length];
      const billboardMaterial = NeonMaterials.createNeonTrim(color);
      const billboard = new THREE.Mesh(billboardGeometry, billboardMaterial);
      billboard.position.set(x, height, z);
      billboard.rotation.y = Math.atan2(x, z);
      this.scene.add(billboard);
      this.buildings.push(billboard);

      const light = new THREE.SpotLight(color, 1, 15, Math.PI / 6);
      light.position.set(x, height, z);
      light.target.position.set(x, height - 5, z);
      this.scene.add(light);
      this.scene.add(light.target);
      this.neonLights.push(light);
    }
  }

  addStreetLights(colors) {
    const gridSpacing = 15;
    const gridSize = 6;

    for (let i = -gridSize; i <= gridSize; i++) {
      for (let j = -gridSize; j <= gridSize; j++) {
        if (Math.abs(i) < 2 && Math.abs(j) < 2) continue; // Skip center

        const x = i * gridSpacing + (Math.random() - 0.5) * 3;
        const z = j * gridSpacing + (Math.random() - 0.5) * 3;
        const color = colors[Math.floor(Math.random() * colors.length)];

        // Street light pole
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.15, 5, 6);
        const poleMaterial = new THREE.MeshStandardMaterial({
          color: 0x333333,
          metalness: 0.8,
          roughness: 0.4
        });
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(x, 2.5, z);
        this.scene.add(pole);
        this.buildings.push(pole);

        // Light fixture
        const fixtureGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        const fixtureMaterial = NeonMaterials.createNeonTrim(color);
        const fixture = new THREE.Mesh(fixtureGeometry, fixtureMaterial);
        fixture.position.set(x, 5, z);
        this.scene.add(fixture);
        this.buildings.push(fixture);

        const light = new THREE.PointLight(color, 0.5, 15);
        light.position.set(x, 5, z);
        this.scene.add(light);
        this.neonLights.push(light);
      }
    }
  }

  update(deltaTime) {
    // Disabled light pulsing for performance
    // Pulsing every light every frame is expensive
  }

  clearMap() {
    this.buildings.forEach(building => {
      building.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose());
          } else {
            obj.material.dispose();
          }
        }
      });
      this.scene.remove(building);
    });
    this.buildings = [];
    this.buildingColliders = [];
    this.neonLights = [];
  }

  // Get collision data for player controller
  getBuildingColliders() {
    return this.buildingColliders;
  }

  dispose() {
    this.clearMap();
  }
}
