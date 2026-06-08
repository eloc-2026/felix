import EventBus from '../utils/EventBus.js';
import { SniperScopeSystem } from './SniperScopeSystem.js';

export class UISystem {
  constructor() {
    // HUD elements
    this.healthBar = document.getElementById('health-bar');
    this.healthText = document.getElementById('health-text');
    this.ammoText = document.getElementById('ammo-text');
    this.weaponName = document.getElementById('weapon-name');
    this.killsText = document.getElementById('kills');
    this.crosshair = document.getElementById('crosshair');
    this.sniperScope = document.getElementById('sniper-scope');

    // Screens
    this.startScreen = document.getElementById('start-screen');
    this.deathScreen = document.getElementById('death-screen');
    this.deathKills = document.getElementById('death-kills');
    this.restartBtn = document.getElementById('restart-btn');

    // State
    this.currentWeapon = 'PISTOL';
    this.isAiming = false;

    // Sniper scope system for breathing effect
    this.sniperScopeSystem = new SniperScopeSystem();

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Player events
    EventBus.on('player:damage', (data) => this.updateHealth(data.health));
    EventBus.on('player:death', (data) => this.showDeathScreen(data.kills));
    EventBus.on('player:kill', (data) => this.updateKills(data.kills));
    EventBus.on('player:reset', () => this.resetUI());

    // Weapon events
    EventBus.on('weapon:switch', (data) => this.updateWeapon(data));
    EventBus.on('weapon:fire', (data) => this.updateAmmo(data));
    EventBus.on('weapon:reload', (data) => this.updateAmmo(data));
    EventBus.on('weapon:aim', (data) => this.updateCrosshair(data.isAiming));
  }

  updateCrosshair(isAiming) {
    this.isAiming = isAiming;

    // Check if we should show sniper scope
    const isSniperRifle = this.currentWeapon === 'SNIPER';

    if (isSniperRifle && isAiming) {
      // Show sniper scope, hide regular crosshair
      this.sniperScope.classList.remove('hidden');
      this.crosshair.classList.add('hidden');
      this.sniperScopeSystem.setActive(true);
    } else {
      // Hide sniper scope, show regular crosshair
      this.sniperScope.classList.add('hidden');
      this.crosshair.classList.remove('hidden');
      this.sniperScopeSystem.setActive(false);

      // Update regular crosshair aiming state
      if (isAiming) {
        this.crosshair.classList.add('aiming');
      } else {
        this.crosshair.classList.remove('aiming');
      }
    }
  }

  update(deltaTime) {
    this.sniperScopeSystem.update(deltaTime);
  }

  updateHealth(health) {
    const healthPercent = Math.max(0, health);
    this.healthBar.style.width = healthPercent + '%';
    this.healthText.textContent = Math.round(healthPercent);
  }

  updateAmmo(data) {
    this.ammoText.textContent = `${data.current} / ${data.reserve}`;
  }

  updateWeapon(data) {
    this.currentWeapon = data.name.toUpperCase();
    this.weaponName.textContent = this.currentWeapon;
    this.updateAmmo({ current: data.ammo, reserve: data.reserve });

    // Hide scope when switching away from sniper
    if (this.currentWeapon !== 'SNIPER') {
      this.sniperScope.classList.add('hidden');
      this.crosshair.classList.remove('hidden');
    }
  }

  updateKills(kills) {
    this.killsText.textContent = kills;
  }

  showDeathScreen(kills) {
    this.deathKills.textContent = kills;
    this.deathScreen.classList.remove('hidden');
  }

  hideDeathScreen() {
    this.deathScreen.classList.add('hidden');
  }

  showStartScreen() {
    this.startScreen.classList.remove('hidden');
  }

  hideStartScreen() {
    this.startScreen.classList.add('hidden');
  }

  resetUI() {
    this.updateHealth(100);
    this.updateKills(0);
    this.hideDeathScreen();
  }

  onRestartClick(callback) {
    this.restartBtn.addEventListener('click', callback);
  }
}
