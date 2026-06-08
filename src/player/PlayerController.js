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

    // Sliding
    this.isSliding = false;
    this.slideSpeed = Config.PLAYER_SPEED * 1.8; // Faster when sliding
    this.slideDuration = 0.6; // seconds
    this.slideTimer = 0;
    this.slideDirection = new THREE.Vector3();
    this.slideCooldown = 0;
    this.slideCooldownTime = 1.0; // seconds before can slide again

    // Climbing
    this.isClimbing = false;
    this.climbSpeed = 5; // units per second
    this.climbHeight = 0;
    this.targetClimbHeight = 0;
    this.canClimb = false;
    this.nearbyClimbableObject = null;
    this.climbingBuilding = null;

    // Footsteps
    this.footstepTimer = 0;
    this.footstepInterval = 0.4; // seconds between footsteps

    // Jumping and gravity
    this.isJumping = false;
    this.isGrounded = true;
    this.verticalVelocity = 0;
    this.jumpForce = 8; // Initial jump velocity
    this.gravity = 20; // Gravity acceleration
    this.groundLevel = Config.PLAYER_HEIGHT;
    this.currentGroundLevel = Config.PLAYER_HEIGHT; // Can be building roof

    // Collision
    this.buildingColliders = [];
    this.playerRadius = 0.5; // Player collision radius
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
    // Update slide cooldown
    if (this.slideCooldown > 0) {
      this.slideCooldown -= deltaTime;
    }

    // Handle climbing
    if (this.isClimbing) {
      this.handleClimbing(deltaTime);
      return;
    }

    // Handle sliding
    if (this.isSliding) {
      this.handleSliding(deltaTime);
      return;
    }

    // Apply gravity and handle jumping
    this.handleVerticalMovement(deltaTime);

    // Reset direction
    this.direction.set(0, 0, 0);

    // WASD movement (relative to look direction)
    if (this.input.isKeyPressed('KeyW')) this.direction.z = -1; // W = backward
    if (this.input.isKeyPressed('KeyS')) this.direction.z = 1;  // S = forward
    if (this.input.isKeyPressed('KeyA')) this.direction.x = -1;
    if (this.input.isKeyPressed('KeyD')) this.direction.x = 1;

    // Normalize to prevent faster diagonal movement
    if (this.direction.length() > 0) {
      this.direction.normalize();
      this.isMoving = true;
    } else {
      this.isMoving = false;
    }

    // Check for slide input (Ctrl or C key while moving)
    if ((this.input.isKeyPressed('ControlLeft') || this.input.isKeyPressed('KeyC')) &&
        this.isMoving && !this.isSliding && this.slideCooldown <= 0) {
      this.startSlide();
      return;
    }

    // Check for climb input (Space near climbable object) - climbing takes priority
    if (this.input.isKeyPressed('Space') && this.canClimb && !this.isClimbing && this.climbingBuilding) {
      this.startClimb();
      return;
    }

    // Check for jump input (Space when grounded and not near climbable)
    if (this.input.isKeyPressed('Space') && this.isGrounded && !this.canClimb) {
      this.jump();
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

      // Apply movement with collision detection
      const newPosition = this.player.position.clone().add(this.moveVector);
      if (!this.checkCollision(newPosition)) {
        this.player.position.copy(newPosition);
      } else {
        // Try sliding along walls by testing X and Z separately
        const slideX = this.player.position.clone();
        slideX.x = newPosition.x;
        if (!this.checkCollision(slideX)) {
          this.player.position.x = slideX.x;
        }

        const slideZ = this.player.position.clone();
        slideZ.z = newPosition.z;
        if (!this.checkCollision(slideZ)) {
          this.player.position.z = slideZ.z;
        }
      }

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

    // Height is now managed by handleVerticalMovement
    // This code is removed and replaced by the gravity/jumping system
  }

  startSlide() {
    if (!this.isGrounded) return; // Can only slide when on ground

    this.isSliding = true;
    this.slideTimer = 0;

    // Store slide direction based on current movement
    this.slideDirection.set(0, 0, 0);

    // Forward/backward
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
    this.slideDirection.add(forward.multiplyScalar(this.direction.z));

    // Left/right
    const right = new THREE.Vector3(1, 0, 0);
    right.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.player.yaw);
    this.slideDirection.add(right.multiplyScalar(this.direction.x));

    this.slideDirection.normalize();

    // Lower camera height during slide
    this.player.position.y = this.currentGroundLevel - Config.PLAYER_HEIGHT * 0.4;

    EventBus.emit('player:slide-start', {});
  }

  handleSliding(deltaTime) {
    this.slideTimer += deltaTime;

    // Calculate slide speed (decelerates over time)
    const slideProgress = this.slideTimer / this.slideDuration;
    const currentSlideSpeed = this.slideSpeed * (1 - slideProgress * 0.5);

    // Move in slide direction with collision detection
    const slideMove = this.slideDirection.clone();
    slideMove.multiplyScalar(currentSlideSpeed * deltaTime);
    const newPosition = this.player.position.clone().add(slideMove);

    if (!this.checkCollision(newPosition)) {
      this.player.position.copy(newPosition);
    }

    // Boundary checking
    const halfWorld = Config.WORLD_SIZE / 2 - 2;
    this.player.position.x = Math.max(-halfWorld, Math.min(halfWorld, this.player.position.x));
    this.player.position.z = Math.max(-halfWorld, Math.min(halfWorld, this.player.position.z));

    // Apply gravity even while sliding (so you fall off buildings)
    this.handleVerticalMovement(deltaTime);

    // End slide when duration is over or if in air
    if (this.slideTimer >= this.slideDuration || !this.isGrounded) {
      this.endSlide();
    }
  }

  endSlide() {
    this.isSliding = false;
    this.slideTimer = 0;
    this.slideCooldown = this.slideCooldownTime;
    EventBus.emit('player:slide-end', {});
  }

  jump() {
    if (!this.isGrounded) return;

    this.isJumping = true;
    this.isGrounded = false;
    this.verticalVelocity = this.jumpForce;
    EventBus.emit('player:jump', {});
  }

  handleVerticalMovement(deltaTime) {
    // Check what ground level we should be at
    this.updateGroundLevel();

    // Apply gravity
    if (!this.isGrounded) {
      this.verticalVelocity -= this.gravity * deltaTime;
    }

    // Apply vertical velocity
    this.player.position.y += this.verticalVelocity * deltaTime;

    // Check if we've landed
    if (this.player.position.y <= this.currentGroundLevel) {
      this.player.position.y = this.currentGroundLevel;
      this.verticalVelocity = 0;
      this.isGrounded = true;
      this.isJumping = false;
    } else {
      this.isGrounded = false;
    }
  }

  updateGroundLevel() {
    // Check if player should be on a building roof
    const playerFootLevel = this.player.position.y - Config.PLAYER_HEIGHT;
    let foundRoof = false;

    for (const building of this.buildingColliders) {
      // Check if player is above this building
      if (playerFootLevel >= building.maxY - 1 &&
          this.player.position.x > building.minX &&
          this.player.position.x < building.maxX &&
          this.player.position.z > building.minZ &&
          this.player.position.z < building.maxZ) {
        // Player is on or above this building roof
        this.currentGroundLevel = building.maxY + Config.PLAYER_HEIGHT;
        foundRoof = true;
        break;
      }
    }

    // If not on a building, ground level is normal
    if (!foundRoof) {
      this.currentGroundLevel = Config.PLAYER_HEIGHT;
    }
  }

  startClimb() {
    if (!this.climbingBuilding) return;

    this.isClimbing = true;
    this.climbHeight = this.player.position.y;

    // Climb to the top of the building
    this.targetClimbHeight = this.climbingBuilding.maxY + Config.PLAYER_HEIGHT;

    EventBus.emit('player:climb-start', {});
  }

  handleClimbing(deltaTime) {
    // Move upward
    if (this.player.position.y < this.targetClimbHeight) {
      this.player.position.y += this.climbSpeed * deltaTime;

      // Also move slightly toward the building center to stay on the wall
      if (this.climbingBuilding) {
        const centerX = this.climbingBuilding.x;
        const centerZ = this.climbingBuilding.z;
        const toCenter = new THREE.Vector3(
          centerX - this.player.position.x,
          0,
          centerZ - this.player.position.z
        );

        // Only move inward if too far from wall
        if (toCenter.length() > 1.5) {
          toCenter.normalize();
          this.player.position.x += toCenter.x * 0.5 * deltaTime;
          this.player.position.z += toCenter.z * 0.5 * deltaTime;
        }
      }
    } else {
      // Reached top, end climb
      this.player.position.y = this.targetClimbHeight;
      this.endClimb();
    }
  }

  endClimb() {
    this.isClimbing = false;
    this.climbHeight = 0;
    this.targetClimbHeight = 0;
    this.climbingBuilding = null;
    this.verticalVelocity = 0; // Reset vertical velocity after climbing
    this.isGrounded = false; // Will land on next frame
    EventBus.emit('player:climb-end', {});
  }

  checkForClimbableObjects() {
    // Check if player is near a building wall and can climb
    this.canClimb = false;
    this.climbingBuilding = null;

    const playerPos = this.player.position;
    const climbDistance = 2; // How close to wall to enable climbing

    for (const building of this.buildingColliders) {
      // Check if player is above ground and below building top
      if (playerPos.y < building.maxY - 2) {
        // Check distance to each face of the building
        const distToWallX = Math.min(
          Math.abs(playerPos.x - building.minX),
          Math.abs(playerPos.x - building.maxX)
        );
        const distToWallZ = Math.min(
          Math.abs(playerPos.z - building.minZ),
          Math.abs(playerPos.z - building.maxZ)
        );

        // Check if within X bounds (for Z walls) or Z bounds (for X walls)
        const withinXBounds = playerPos.x >= building.minX - climbDistance &&
                             playerPos.x <= building.maxX + climbDistance;
        const withinZBounds = playerPos.z >= building.minZ - climbDistance &&
                             playerPos.z <= building.maxZ + climbDistance;

        // Near a wall?
        if ((distToWallX < climbDistance && withinZBounds) ||
            (distToWallZ < climbDistance && withinXBounds)) {
          this.canClimb = true;
          this.climbingBuilding = building;
          break;
        }
      }
    }
  }

  checkCollision(position) {
    // Check collision with buildings
    for (const building of this.buildingColliders) {
      // Only check collision if player is at ground level or climbing
      // If player is above the building (on top), allow walking through
      const playerHeight = position.y;
      const playerFootLevel = playerHeight - Config.PLAYER_HEIGHT;

      // Check if player's feet are within the building height (not standing on top)
      if (playerFootLevel < building.maxY && playerHeight > building.minY) {
        // AABB collision check with player radius
        if (position.x + this.playerRadius > building.minX &&
            position.x - this.playerRadius < building.maxX &&
            position.z + this.playerRadius > building.minZ &&
            position.z - this.playerRadius < building.maxZ) {
          return true; // Collision detected
        }
      }
    }
    return false; // No collision
  }

  setBuildingColliders(colliders) {
    this.buildingColliders = colliders;
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
