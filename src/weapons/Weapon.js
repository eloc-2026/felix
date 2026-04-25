import EventBus from '../utils/EventBus.js';

export class Weapon {
  constructor(config) {
    this.config = config;
    this.name = config.name;
    this.damage = config.damage;
    this.fireRate = config.fireRate;
    this.magazineSize = config.magazineSize;
    this.reloadTime = config.reloadTime;
    this.muzzleVelocity = config.muzzleVelocity;
    this.recoilPattern = config.recoilPattern;
    this.recoilRecovery = config.recoilRecovery;
    this.spread = config.spread;
    this.range = config.range;
    this.bulletDrop = config.bulletDrop;

    // State
    this.currentAmmo = config.magazineSize;
    this.reserveAmmo = config.reserveAmmo;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.fireTimer = 0;
    this.recoilIndex = 0;
    this.currentRecoil = { x: 0, y: 0 };

    // Shotgun specific
    this.pelletCount = config.pelletCount || 1;
  }

  canFire() {
    return !this.isReloading &&
           this.currentAmmo > 0 &&
           this.fireTimer <= 0;
  }

  fire() {
    if (!this.canFire()) return null;

    this.currentAmmo--;
    this.fireTimer = 60 / this.fireRate; // Convert RPM to seconds

    // Apply recoil
    const recoil = this.recoilPattern[this.recoilIndex % this.recoilPattern.length];
    this.currentRecoil.x += recoil.x;
    this.currentRecoil.y += recoil.y;
    this.recoilIndex++;

    EventBus.emit('weapon:fire', {
      current: this.currentAmmo,
      reserve: this.reserveAmmo,
      weaponType: this.name
    });

    // Auto reload if empty
    if (this.currentAmmo === 0 && this.reserveAmmo > 0) {
      this.reload();
    }

    return {
      damage: this.damage,
      velocity: this.muzzleVelocity,
      spread: this.spread,
      range: this.range,
      bulletDrop: this.bulletDrop,
      pelletCount: this.pelletCount
    };
  }

  reload() {
    if (this.isReloading ||
        this.currentAmmo === this.magazineSize ||
        this.reserveAmmo === 0) {
      return;
    }

    this.isReloading = true;
    this.reloadTimer = this.reloadTime;

    // Emit reload started event for gun model animation
    EventBus.emit('weapon:reload-start', {
      current: this.currentAmmo,
      reserve: this.reserveAmmo
    });
  }

  update(deltaTime) {
    // Update fire timer
    if (this.fireTimer > 0) {
      this.fireTimer -= deltaTime;
    }

    // Update reload
    if (this.isReloading) {
      this.reloadTimer -= deltaTime;

      if (this.reloadTimer <= 0) {
        const ammoNeeded = this.magazineSize - this.currentAmmo;
        const ammoToAdd = Math.min(ammoNeeded, this.reserveAmmo);

        this.currentAmmo += ammoToAdd;
        this.reserveAmmo -= ammoToAdd;
        this.isReloading = false;
        this.reloadTimer = 0;

        EventBus.emit('weapon:reload', {
          current: this.currentAmmo,
          reserve: this.reserveAmmo
        });
      }
    }

    // Recover recoil
    this.currentRecoil.x *= (1 - this.recoilRecovery);
    this.currentRecoil.y *= (1 - this.recoilRecovery);

    if (Math.abs(this.currentRecoil.x) < 0.0001) this.currentRecoil.x = 0;
    if (Math.abs(this.currentRecoil.y) < 0.0001) this.currentRecoil.y = 0;
  }

  getRecoil() {
    return { ...this.currentRecoil };
  }

  reset() {
    this.currentAmmo = this.magazineSize;
    this.reserveAmmo = this.config.reserveAmmo;
    this.isReloading = false;
    this.reloadTimer = 0;
    this.fireTimer = 0;
    this.recoilIndex = 0;
    this.currentRecoil = { x: 0, y: 0 };
  }
}
