import * as THREE from 'three';
import { Config } from '../utils/Config.js';
import EventBus from '../utils/EventBus.js';

export class PlayerController {
  constructor(player, camera, inputManager) {
    this.player = player;
    this.camera = camera;
    this.input = inputManager;

    // Movement
    this.moveSpeed = Config.PLAYER_SPEED;
    this.aimMoveSpeedMultiplier = 0.6; // Slower when aiming
    this.direction = new THREE.Vector3();
    this.moveVector = new THREE.Vector3();
    this.isMoving = false;
    this.isAiming = false;

    // Footsteps
    this.footstepTimer = 0;
    this.footstepInterval = 0.4; // seconds between footsteps
  }

  update(deltaTime) {
    if (!this.player.isAlive) return;

    this.handleMouseLook();
    this.handleMovement(deltaTime);
    this.updateCamera();
  }

  handleMouseLook() {
    const mouseDelta = this.input.getMouseDelta();

    if (!this.input.isPointerLocked) return;

    // Update yaw (left/right)
    this.player.yaw -= mouseDelta.x * Config.MOUSE_SENSITIVITY;

    // Update pitch (up/down) with clamping
    this.player.pitch -= mouseDelta.y * Config.MOUSE_SENSITIVITY;
    this.player.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.player.pitch));

    // Update rotation
    this.player.rotation.set(this.player.pitch, this.player.yaw, 0);
  }

  handleMovement(deltaTime) {
    // Reset direction
    this.direction.set(0, 0, 0);

    // WASD movement (relative to look direction)
    if (this.input.isKeyPressed('KeyW')) this.direction.z = 1;
    if (this.input.isKeyPressed('KeyS')) this.direction.z = -1;
    if (this.input.isKeyPressed('KeyA')) this.direction.x = -1;
    if (this.input.isKeyPressed('KeyD')) this.direction.x = 1;

    // Normalize to prevent faster diagonal movement
    if (this.direction.length() > 0) {
      this.direction.normalize();
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }

    // Calculate move vector in world space
    this.moveVector.set(0, 0, 0);

    if (this.direction.length() > 0) {
      // Forward/backward
      const forward = new THREE.Vector3(0, 0, 1);
      forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
      this.moveVector.add(forward.multiplyScalar(this.direction.z));

      // Left/right
      const right = new THREE.Vector3(1, 0, 0);
      right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
      this.moveVector.add(right.multiplyScalar(this.direction.x));

      this.moveVector.normalize();

      // Apply move speed with aim modifier
      const currentSpeed = this.isAiming
        ? this.moveSpeed * this.aimMoveSpeedMultiplier
        : this.moveSpeed;
      this.moveVector.multiplyScalar(currentSpeed * deltaTime);

      // Apply movement
      this.player.position.add(this.moveVector);

      // Boundary checking
      const halfWorld = Config.WORLD_SIZE / 2 - 2;
      this.player.position.x = Math.max(-halfWorld, Math.min(halfWorld, this.player.position.x));
      this.player.position.z = Math.max(-halfWorld, Math.min(halfWorld, this.player.position.z));

      // Footstep sounds
      this.footstepTimer += deltaTime;
      if (this.footstepTimer >= this.footstepInterval) {
        this.footstepTimer = 0;
        EventBus.emit('player:footstep', {});
      }
    } else {
      this.footstepTimer = 0;
    }

    // Keep player at correct height
    this.player.position.y = Config.PLAYER_HEIGHT;
  }

  updateCamera() {
    // Position camera at player position
    this.camera.position.copy(this.player.position);

    // Apply rotation
    this.camera.rotation.copy(this.player.rotation);
  }

  setAiming(isAiming) {
    this.isAiming = isAiming;
  }
}
