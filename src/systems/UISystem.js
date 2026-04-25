import EventBus from '../utils/EventBus.js';

export class UISystem {
  constructor() {
    // HUD elements
    this.healthBar = document.getElementById('health-bar');
    this.healthText = document.getElementById('health-text');
    this.ammoText = document.getElementById('ammo-text');
    this.weaponName = document.getElementById('weapon-name');
    this.killsText = document.getElementById('kills');
    this.crosshair = document.getElementById('crosshair');

    // Screens
    this.startScreen = document.getElementById('start-screen');
    this.deathScreen = document.getElementById('death-screen');
    this.deathKills = document.getElementById('death-kills');
    this.restartBtn = document.getElementById('restart-btn');

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
    if (isAiming) {
      this.crosshair.classList.add('aiming');
    } else {
      this.crosshair.classList.remove('aiming');
    }
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
    this.weaponName.textContent = data.name.toUpperCase();
    this.updateAmmo({ current: data.ammo, reserve: data.reserve });
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
