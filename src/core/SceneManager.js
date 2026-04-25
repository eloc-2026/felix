import * as THREE from 'three';
import { Config } from '../utils/Config.js';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(Config.COLORS.DARK_BLUE);
    this.scene.fog = new THREE.FogExp2(Config.COLORS.DARK_BLUE, 0.012);

    this.resizeCallbacks = [];

    // Camera (near plane at 0.01 to avoid clipping gun models)
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.01,  // Very close near plane for first-person gun visibility
      1000
    );
    this.camera.position.set(0, Config.PLAYER_HEIGHT, 0);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    // Lighting
    this.setupLighting();

    // Create ground
    this.createGround();

    // Handle resize
    window.addEventListener('resize', () => this.onResize());
  }

  setupLighting() {
    // Low ambient light for dark atmosphere
    const ambient = new THREE.AmbientLight(0xffffff, 0.1);
    this.scene.add(ambient);

    // Directional light from above (moonlight effect)
    const directional = new THREE.DirectionalLight(Config.COLORS.NEON_CYAN, 0.3);
    directional.position.set(50, 100, 50);
    directional.castShadow = true;
    directional.shadow.camera.left = -50;
    directional.shadow.camera.right = 50;
    directional.shadow.camera.top = 50;
    directional.shadow.camera.bottom = -50;
    this.scene.add(directional);
  }

  createGround() {
    // Grid floor (Tron-style)
    const gridSize = Config.WORLD_SIZE;
    const gridDivisions = 50;
    const gridHelper = new THREE.GridHelper(
      gridSize,
      gridDivisions,
      Config.COLORS.FLOOR_GRID,
      Config.COLORS.FLOOR_GRID
    );
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    this.scene.add(gridHelper);

    // Actual floor plane for collisions
    const floorGeometry = new THREE.PlaneGeometry(gridSize, gridSize);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: Config.COLORS.DARK_BLUE,
      roughness: 0.8,
      metalness: 0.2
    });
    this.floor = new THREE.Mesh(floorGeometry, floorMaterial);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
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
