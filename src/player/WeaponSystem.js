import { Pistol } from '../weapons/Pistol.js';
import { Rifle } from '../weapons/Rifle.js';
import { Shotgun } from '../weapons/Shotgun.js';
import { Sniper } from '../weapons/Sniper.js';
import { ProjectileSystem } from '../weapons/ProjectileSystem.js';
import { ParticleSystem } from '../systems/ParticleSystem.js';
import { PistolModel, RifleModel, ShotgunModel, SniperModel } from '../weapons/GunModel.js';
import { HitMarkerSystem } from '../systems/HitMarkerSystem.js';
import { DamageNumberSystem } from '../systems/DamageNumberSystem.js';
import EventBus from '../utils/EventBus.js';
import * as THREE from 'three';

export class WeaponSystem {
  constructor(scene, player, camera, inputManager, playerController) {
    this.scene = scene;
    this.player = player;
    this.camera = camera;
    this.input = inputManager;
    this.playerController = playerController;

    // Weapon inventory
    this.weapons = [
      new Pistol(),
      new Rifle(),
      new Shotgun(),
      new Sniper()
    ];

    this.currentWeaponIndex = 0;
    this.currentWeapon = this.weapons[0];

    // Gun models
    this.gunModels = [
      new PistolModel(camera),
      new RifleModel(camera),
      new ShotgunModel(camera),
      new SniperModel(camera)
    ];

    this.currentGunModel = this.gunModels[0];

    // Hide other gun models initially
    this.gunModels.forEach((model, index) => {
      if (index !== 0) {
        model.group.visible = false;
      }
    });

    // Systems
    this.projectileSystem = new ProjectileSystem(scene, camera);
    this.particleSystem = new ParticleSystem(scene);
    this.hitMarkerSystem = new HitMarkerSystem();
    this.damageNumberSystem = new DamageNumberSystem(scene, camera);

    // Enemy reference (will be set by Game)
    this.enemies = [];

    // Building meshes for collision (will be set by Game)
    this.buildingMeshes = [];

    // ADS state
    this.isAiming = false;
    this.baseFOV = 75;
    this.aimFOV = 55; // Zoomed in FOV when aiming (default for most weapons)
    this.sniperAimFOV = 25; // Extra zoom for sniper scope (8x magnification)

    // Listen for enemy deaths
    EventBus.on('enemy:death', () => {
      this.player.addKill();
    });

    // Listen for reload start to trigger gun model animation
    EventBus.on('weapon:reload-start', () => {
      this.currentGunModel.playReloadAnimation();
    });

    // Emit initial weapon state
    EventBus.emit('weapon:switch', {
      name: this.currentWeapon.name,
      ammo: this.currentWeapon.currentAmmo,
      reserve: this.currentWeapon.reserveAmmo
    });
  }

  update(deltaTime) {
    if (!this.player.isAlive) return;

    // Handle aiming (right mouse button)
    const wasAiming = this.isAiming;
    this.isAiming = this.input.isMouseButtonPressed(2); // Right click

    if (this.isAiming !== wasAiming) {
      this.currentGunModel.setAiming(this.isAiming);
      if (this.playerController) {
        this.playerController.setAiming(this.isAiming);
      }
      EventBus.emit('weapon:aim', { isAiming: this.isAiming });
    }

    // Update camera FOV based on aim state
    const aimProgress = this.currentGunModel.getAimProgress();
    // Use sniper FOV if currently using sniper rifle
    const targetAimFOV = this.currentWeaponIndex === 3 ? this.sniperAimFOV : this.aimFOV;
    const targetFOV = THREE.MathUtils.lerp(this.baseFOV, targetAimFOV, aimProgress);
    this.camera.fov = targetFOV;
    this.camera.updateProjectionMatrix();

    // Update current weapon
    this.currentWeapon.update(deltaTime);

    // Update gun model with movement state
    const isMoving = this.playerController ? this.playerController.isMoving : false;
    this.currentGunModel.update(deltaTime, isMoving);

    // Handle weapon switching (keys 1-4)
    if (this.input.isKeyPressed('Digit1')) this.switchWeapon(0);
    if (this.input.isKeyPressed('Digit2')) this.switchWeapon(1);
    if (this.input.isKeyPressed('Digit3')) this.switchWeapon(2);
    if (this.input.isKeyPressed('Digit4')) this.switchWeapon(3);

    // Handle reload
    if (this.input.isKeyPressed('KeyR')) {
      this.currentWeapon.reload();
    }

    // Handle firing
    if (this.input.isMouseButtonPressed(0)) { // Left click
      this.fire();
    }

    // Apply recoil to camera
    this.applyRecoil();

    // Update projectile system
    this.projectileSystem.update(deltaTime);

    // Update damage numbers
    this.damageNumberSystem.update();
  }

  switchWeapon(index) {
    if (index === this.currentWeaponIndex || index >= this.weapons.length) return;

    // Hide current gun model
    this.currentGunModel.group.visible = false;

    // Switch weapon
    this.currentWeaponIndex = index;
    this.currentWeapon = this.weapons[index];
    this.currentGunModel = this.gunModels[index];

    // Show new gun model
    this.currentGunModel.group.visible = true;

    EventBus.emit('weapon:switch', {
      name: this.currentWeapon.name,
      ammo: this.currentWeapon.currentAmmo,
      reserve: this.currentWeapon.reserveAmmo
    });
  }

  fire() {
    const weaponData = this.currentWeapon.fire();

    if (!weaponData) return;

    // Play gun model fire animation
    this.currentGunModel.playFireAnimation();

    // Get firing direction from camera CENTER (where crosshair points)
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(this.camera.quaternion);

    // Fire from camera center (Call of Duty style - bullets come from crosshair, not gun model)
    const bulletOrigin = this.camera.position.clone();
    bulletOrigin.add(direction.clone().multiplyScalar(0.3));

    // Get gun model muzzle position for visual effects only
    const gunWorldPosition = new THREE.Vector3();
    this.currentGunModel.group.getWorldPosition(gunWorldPosition);

    // Offset to approximate muzzle position on the gun model
    const muzzleOffset = new THREE.Vector3(0.3, 0, 0); // Right side offset for muzzle
    muzzleOffset.applyQuaternion(this.camera.quaternion);
    const visualMuzzlePosition = gunWorldPosition.clone().add(muzzleOffset);

    // Fire projectile(s) from camera center (gameplay)
    const results = this.projectileSystem.fireBullet(
      bulletOrigin,
      direction,
      weaponData,
      this.enemies,
      this.buildingMeshes
    );

    // Create enhanced visual effects at gun model position
    this.particleSystem.createMuzzleFlash(visualMuzzlePosition, direction);
    this.projectileSystem.createMuzzleFlash(visualMuzzlePosition, direction);
    this.projectileSystem.createShellCasing(visualMuzzlePosition, direction);

    // Add screen shake based on weapon type
    const shakeIntensity = weaponData.pelletCount > 1 ? 0.008 : 0.004;
    this.projectileSystem.addScreenShake(shakeIntensity);

    // Process hits
    let hitEnemy = false;
    results.forEach(result => {
      if (result.hit && !result.hitBuilding && result.object.userData.enemy) {
        const enemy = result.object.userData.enemy;
        const wasAlive = enemy.isAlive;
        enemy.takeDamage(result.damage);

        // Show hit marker and damage number
        if (wasAlive) {
          hitEnemy = true;
          const isHeadshot = result.isHeadshot || false;

          // Check if kill
          if (!enemy.isAlive) {
            this.hitMarkerSystem.showHitMarker(true, isHeadshot); // Kill marker with headshot flag
            this.damageNumberSystem.showDamage(result.point, result.damage, true);

            // Emit headshot kill event if applicable
            if (isHeadshot) {
              EventBus.emit('combat:headshot-kill', { damage: result.damage });
            }
          } else {
            this.hitMarkerSystem.showHitMarker(false, isHeadshot); // Hit marker with headshot flag
            this.damageNumberSystem.showDamage(result.point, result.damage, false);

            // Emit headshot hit event if applicable
            if (isHeadshot) {
              EventBus.emit('combat:headshot', { damage: result.damage });
            }
          }
        }
      }
    });

    // If we hit nothing, no marker
    // The marker is shown above per hit
  }

  applyRecoil() {
    const recoil = this.currentWeapon.getRecoil();

    // Reduce recoil when aiming
    const recoilMultiplier = this.isAiming ? 0.5 : 1.0;

    // Apply recoil to pitch and yaw
    this.player.pitch += recoil.y * recoilMultiplier;
    this.player.yaw += recoil.x * recoilMultiplier;

    // Clamp pitch
    this.player.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.player.pitch));
  }

  setEnemies(enemies) {
    this.enemies = enemies;
  }

  setBuildingColliders(buildingMeshes) {
    this.buildingMeshes = buildingMeshes;
  }

  reset() {
    this.weapons.forEach(weapon => weapon.reset());

    // Hide all gun models except first
    this.gunModels.forEach((model, index) => {
      model.group.visible = (index === 0);
    });

    this.currentWeaponIndex = 0;
    this.currentWeapon = this.weapons[0];
    this.currentGunModel = this.gunModels[0];

    EventBus.emit('weapon:switch', {
      name: this.currentWeapon.name,
      ammo: this.currentWeapon.currentAmmo,
      reserve: this.currentWeapon.reserveAmmo
    });
  }
}
