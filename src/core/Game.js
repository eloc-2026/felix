import { SceneManager } from './SceneManager.js';
import { InputManager } from './InputManager.js';
import { GameLoop } from './GameLoop.js';
import { Player } from '../player/Player.js';
import { PlayerController } from '../player/PlayerController.js';
import { UISystem } from '../systems/UISystem.js';
import { CyberpunkCity } from '../environment/CyberpunkCity.js';
import { PostProcessingSystem } from '../systems/PostProcessing.js';
import { WeaponSystem } from '../player/WeaponSystem.js';
import { EnemySpawner } from '../enemies/EnemySpawner.js';
import { DamageSystem } from '../systems/DamageSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';

export class Game {
  constructor() {
    this.isStarted = false;
    this.isPaused = false;

    // Core systems
    this.sceneManager = new SceneManager();
    this.inputManager = new InputManager();
    this.uiSystem = new UISystem();

    // Environment
    this.city = new CyberpunkCity(this.sceneManager.scene);
    this.city.generate();

    // Post-processing
    this.postProcessing = new PostProcessingSystem(
      this.sceneManager.renderer,
      this.sceneManager.scene,
      this.sceneManager.camera
    );

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
  }

  setupStartScreen() {
    const startScreen = document.getElementById('start-screen');
    startScreen.addEventListener('click', () => {
      this.start();
    });
  }

  setupRestartButton() {
    this.uiSystem.onRestartClick(() => {
      this.restart();
    });
  }

  start() {
    if (this.isStarted) return;

    this.isStarted = true;
    this.uiSystem.hideStartScreen();
    this.inputManager.requestPointerLock();

    // Resume audio context (browser autoplay policy)
    this.audioSystem.resume();
    this.audioSystem.startAmbientMusic();

    // Spawn initial enemies
    this.enemySpawner.spawnWave(5);

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

    // Update player
    this.playerController.update(deltaTime);

    // Update weapon system
    this.weaponSystem.update(deltaTime);

    // Update enemy meshes for weapon system
    this.weaponSystem.setEnemies(this.enemySpawner.getEnemyMeshes());

    // Update enemies
    this.enemySpawner.update(deltaTime);

    // Update environment
    this.city.update(deltaTime);

    // Update damage system (visual effects)
    this.damageSystem.update(deltaTime);

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
    this.postProcessing.dispose();
    this.sceneManager.dispose();
  }
}
