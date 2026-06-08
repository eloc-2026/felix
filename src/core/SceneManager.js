import * as THREE from 'three';
import { Config } from '../utils/Config.js';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(Config.COLORS.DARK_BLUE);
    this.scene.fog = new THREE.FogExp2(Config.COLORS.DARK_BLUE, 0.012); // Increased fog for better performance

    this.resizeCallbacks = [];
    this.atmosphereParticles = null;

    // Camera (near plane at 0.01 to avoid clipping gun models)
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01,  // Very close near plane for first-person gun visibility
      1000
    );
    this.camera.position.set(0, Config.PLAYER_HEIGHT, 0);

    // Optimized renderer for better performance
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,  // Disabled for performance
      powerPreference: "high-performance",
      stencil: false,
      depth: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap pixel ratio
    this.renderer.shadowMap.enabled = false; // Disabled shadows for performance

    // Simplified tone mapping
    this.renderer.toneMapping = THREE.LinearToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    document.body.appendChild(this.renderer.domElement);

    // Lighting
    this.setupLighting();

    // Create ground
    this.createGround();

    // Add atmospheric particles
    this.createAtmosphereParticles();

    // Handle resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Optimized lighting - fewer lights for better performance
    const ambient = new THREE.AmbientLight(0x4a5f7f, 0.25);
    this.scene.add(ambient);

    // Single directional light (no shadows for performance)
    const directional = new THREE.DirectionalLight(Config.COLORS.NEON_CYAN, 0.6);
    directional.position.set(50, 100, 50);
    directional.castShadow = false;
    this.scene.add(directional);

    // Hemisphere light for better depth
    const hemisphereLight = new THREE.HemisphereLight(
      0x0066ff, // Sky color (cyan)
      0x1a0033, // Ground color (dark purple)
      0.3
    );
    this.scene.add(hemisphereLight);
  }

  createGround() {
    // Enhanced grid floor (Tron-style)
    const gridSize = Config.WORLD_SIZE;
    const gridDivisions = 60;
    const gridHelper = new THREE.GridHelper(
      gridSize,
      gridDivisions,
      Config.COLORS.FLOOR_GRID,
      Config.COLORS.FLOOR_GRID
    );
    gridHelper.material.opacity = 0.4;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Actual floor plane for collisions with subtle emissive glow
    const floorGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: Config.COLORS.DARK_BLUE,
      emissive: Config.COLORS.NEON_CYAN,
      emissiveIntensity: 0.05,
      roughness: 0.7,
      metalness: 0.3
    });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
  }

  createAtmosphereParticles() {
    // Reduced particle count from 500 to 200 for performance
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    const colors = [];

    const colorOptions = [
      new THREE.Color(Config.COLORS.NEON_CYAN),
      new THREE.Color(Config.COLORS.NEON_PINK),
      new THREE.Color(Config.COLORS.NEON_PURPLE)
    ];

    for (let i = 0; i < particleCount; i++) {
      const x = (Math.random() - 0.5) * Config.WORLD_SIZE * 1.5;
      const y = Math.random() * 50;
      const z = (Math.random() - 0.5) * Config.WORLD_SIZE * 1.5;
      positions.push(x, y, z);

      const color = colorOptions[Math.floor(Math.random() * colorOptions.length)];
      colors.push(color.r, color.g, color.b);
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.atmosphereParticles = new THREE.Points(geometry, material);
    this.scene.add(this.atmosphereParticles);
  }

  updateAtmosphere(time) {
    if (this.atmosphereParticles) {
      // Slowly rotate and move particles
      this.atmosphereParticles.rotation.y = time * 0.02;

      const positions = this.atmosphereParticles.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + i) * 0.001; // Gentle floating

        // Wrap around vertically
        if (positions[i + 1] > 50) positions[i + 1] = 0;
        if (positions[i + 1] < 0) positions[i + 1] = 50;
      }
      this.atmosphereParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Notify resize callbacks (e.g., post-processing)
    this.resizeCallbacks.forEach(cb => cb());
  }

  addResizeCallback(callback) {
    this.resizeCallbacks.push(callback);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    document.body.removeChild(this.renderer.domElement);
  }
}
