import * as THREE from 'three';
import { SceneManager } from './SceneManager.js';
import { InputManager } from './InputManager.js';
import { GameLoop } from './GameLoop.js';
import { Player } from '../player/Player.js';
import { PlayerController } from '../player/PlayerController.js';
import { UISystem } from '../systems/UISystem.js';
import { MapManager } from '../environment/MapManager.js';
import { CyberpunkCity } from '../environment/CyberpunkCity.js';
import { PostProcessingSystem } from '../systems/PostProcessing.js';
import { WeaponSystem } from '../player/WeaponSystem.js';
import { EnemySpawner } from '../enemies/EnemySpawner.js';
import { DamageSystem } from '../systems/DamageSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';
import { SettingsManager } from '../systems/SettingsManager.js';

export class Game {
  constructor(loadingManager = null) {
    this.isStarted = false;
    this.isPaused = false;
    this.loadingManager = loadingManager;

    // Settings system
    this.settingsManager = new SettingsManager();

    // Core systems
    this.sceneManager = new SceneManager();
    this.inputManager = new InputManager();
    this.uiSystem = new UISystem();

    // Environment
    this.mapManager = new MapManager(this.sceneManager.scene);
    const initialSettings = this.settingsManager.getSettings();
    this.mapManager.loadMap(initialSettings.map);

    // Generate simple buildings
    this.city = new CyberpunkCity(this.sceneManager.scene);
    this.city.generate();
    console.log('Simple buildings generated!');

    // Post-processing
    this.postProcessing = new PostProcessingSystem(
      this.sceneManager.renderer,
      this.sceneManager.scene,
      this.sceneManager.camera
    );

    // Apply initial graphics settings
    this.applyGraphicsSettings(initialSettings);

    // Register resize callback for post-processing
    this.sceneManager.addResizeCallback(() => {
      this.postProcessing.onResize();
    });

    // Damage system
    this.damageSystem = new DamageSystem(
      this.sceneManager.camera,
      this.postProcessing
    );

    // Audio system
    this.audioSystem = new AudioSystem();

    // Player
    this.player = new Player(this.sceneManager.scene);
    this.playerController = new PlayerController(
      this.player,
      this.sceneManager.camera,
      this.inputManager
    );

    // Weapon system (pass playerController for movement state)
    this.weaponSystem = new WeaponSystem(
      this.sceneManager.scene,
      this.player,
      this.sceneManager.camera,
      this.inputManager,
      this.playerController
    );

    // Enemy spawner
    this.enemySpawner = new EnemySpawner(
      this.sceneManager.scene,
      this.player
    );

    // Connect weapon system to enemies
    this.weaponSystem.setEnemies(this.enemySpawner.getEnemyMeshes());

    // Game loop
    this.gameLoop = new GameLoop(
      (deltaTime) => this.update(deltaTime),
      (alpha) => this.render(alpha)
    );

    // Setup
    this.setupStartScreen();
    this.setupRestartButton();
    this.setupSettingsListeners();
  }

  setupStartScreen() {
    const startScreen = document.getElementById('start-screen');

    // Listen for spacebar to start the game
    const handleKeyPress = (event) => {
      if (event.code === 'Space' && !this.isStarted) {
        event.preventDefault();
        this.start();
        document.removeEventListener('keydown', handleKeyPress);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
  }

  setupRestartButton() {
    this.uiSystem.onRestartClick(() => {
      this.restart();
    });
  }

  setupSettingsListeners() {
    this.settingsManager.onSettingChange((setting, value) => {
      switch (setting) {
        case 'map':
          // Regenerate buildings when map changes
          this.city.dispose();
          this.city.generate();
          this.mapManager.loadMap(value);
          break;
        case 'quality':
          this.postProcessing.setQuality(value);
          break;
        case 'bloom':
          this.postProcessing.setBloomEnabled(value);
          break;
        case 'chromatic':
          this.postProcessing.setChromaticEnabled(value);
          break;
        case 'vignette':
          this.postProcessing.setVignetteEnabled(value);
          break;
        case 'shadows':
          this.sceneManager.renderer.shadowMap.enabled = value;
          break;
      }
    });
  }

  applyGraphicsSettings(settings) {
    this.postProcessing.setQuality(settings.quality);
    this.postProcessing.setBloomEnabled(settings.bloom);
    this.postProcessing.setChromaticEnabled(settings.chromatic);
    this.postProcessing.setVignetteEnabled(settings.vignette);
    this.sceneManager.renderer.shadowMap.enabled = settings.shadows;
  }

  start() {
    if (this.isStarted) return;

    this.isStarted = true;
    this.uiSystem.hideStartScreen();
    this.inputManager.requestPointerLock();

    // Resume audio context (browser autoplay policy)
    this.audioSystem.resume();
    this.audioSystem.startAmbientMusic();

    // Spawn fewer initial enemies for better performance
    this.enemySpawner.spawnWave(3);

    this.gameLoop.start();

    console.log('Game started!');
  }

  restart() {
    this.player.reset();
    this.weaponSystem.reset();
    this.enemySpawner.reset();
    this.uiSystem.resetUI();
    this.inputManager.requestPointerLock();
    console.log('Game restarted!');
  }

  update(deltaTime) {
    if (this.isPaused || !this.player.isAlive) return;

    // Combine building colliders from both CyberpunkCity and MapManager
    const cityColliders = this.city.getBuildingColliders();
    const mapColliders = this.mapManager.getBuildingColliders();
    const allColliders = [...cityColliders, ...mapColliders];

    // Get building meshes for collision detection
    const buildingMeshes = this.city.getBuildingMeshes();

    // Update building colliders for player collision
    this.playerController.setBuildingColliders(allColliders);

    // Update building colliders for weapon system (bullet collision)
    this.weaponSystem.setBuildingColliders(buildingMeshes);

    // Update building colliders for enemy AI (line of sight and shooting)
    this.enemySpawner.setBuildingMeshes(buildingMeshes);

    // Check for climbable objects near player
    this.playerController.checkForClimbableObjects();

    // Update player
    this.playerController.update(deltaTime);

    // Update weapon system
    this.weaponSystem.update(deltaTime);

    // Update enemy meshes for weapon system
    this.weaponSystem.setEnemies(this.enemySpawner.getEnemyMeshes());

    // Update enemies
    this.enemySpawner.update(deltaTime);

    // Update environment
    this.mapManager.update(deltaTime);

    // Update atmosphere particles
    const time = performance.now() * 0.001;
    this.sceneManager.updateAtmosphere(time);

    // Update damage system (visual effects)
    this.damageSystem.update(deltaTime);

    // Update UI system (for sniper scope breathing effect)
    this.uiSystem.update(deltaTime);

    // Check for ESC to pause/unlock pointer
    if (this.inputManager.isKeyPressed('Escape')) {
      this.inputManager.exitPointerLock();
    }
  }

  render(alpha) {
    // Use post-processing instead of direct render
    this.postProcessing.render();
  }

  dispose() {
    this.gameLoop.stop();
    this.audioSystem.dispose();
    this.city.dispose();
    this.mapManager.dispose();
    this.postProcessing.dispose();
    this.sceneManager.dispose();
  }
}
