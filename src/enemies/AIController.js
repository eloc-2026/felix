import * as THREE from 'three';
import { Config } from '../utils/Config.js';
import { AIStates, AIStateConfig } from './AIStates.js';

export class AIController {
  constructor(enemy, player, scene) {
    this.enemy = enemy;
    this.player = player;
    this.scene = scene;

    // Patrol waypoints (random positions around spawn)
    this.patrolWaypoints = this.generatePatrolWaypoints(enemy.position);
    this.currentWaypointIndex = 0;
    this.patrolWaitTimer = 0;

    // Detection
    this.detectionTimer = 0;
    this.raycaster = new THREE.Raycaster();

    // Combat
    this.fireTimer = 0;

    // Building colliders (will be set by EnemySpawner)
    this.buildingMeshes = [];
  }

  generatePatrolWaypoints(center) {
    const waypoints = [];
    const radius = 10;
    const count = 4;

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      waypoints.push(new THREE.Vector3(
        center.x + Math.cos(angle) * radius,
        center.y,
        center.z + Math.sin(angle) * radius
      ));
    }

    return waypoints;
  }

  update(deltaTime) {
    if (!this.enemy.isAlive || !this.player.isAlive) return;

    // Update state machine
    switch (this.enemy.state) {
      case AIStates.PATROL:
        this.updatePatrol(deltaTime);
        break;

      case AIStates.DETECT:
        this.updateDetect(deltaTime);
        break;

      case AIStates.CHASE:
        this.updateChase(deltaTime);
        break;

      case AIStates.ATTACK:
        this.updateAttack(deltaTime);
        break;
    }

    // Check for player detection (from any state except dead)
    if (this.enemy.state !== AIStates.DEAD && this.enemy.state !== AIStates.ATTACK) {
      this.checkPlayerDetection();
    }
  }

  updatePatrol(deltaTime) {
    const targetWaypoint = this.patrolWaypoints[this.currentWaypointIndex];
    const distance = this.enemy.position.distanceTo(targetWaypoint);

    if (distance < 1.0) {
      // Reached waypoint, wait before moving to next
      this.patrolWaitTimer += deltaTime;

      if (this.patrolWaitTimer >= AIStateConfig.PATROL_WAIT_TIME) {
        this.patrolWaitTimer = 0;
        this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.patrolWaypoints.length;
      }
    } else {
      // Move toward waypoint
      this.enemy.moveTo(targetWaypoint, deltaTime * 0.5); // Slow patrol speed
    }
  }

  updateDetect(deltaTime) {
    this.detectionTimer += deltaTime;

    // Look at player
    this.enemy.lookAt(this.player.position);

    if (this.detectionTimer >= AIStateConfig.DETECT_DURATION) {
      // Transition to chase
      this.enemy.state = AIStates.CHASE;
      this.detectionTimer = 0;
    }
  }

  updateChase(deltaTime) {
    const distanceToPlayer = this.enemy.position.distanceTo(this.player.position);

    if (distanceToPlayer <= Config.ENEMY_ATTACK_RANGE) {
      // Close enough to attack
      this.enemy.state = AIStates.ATTACK;
      this.fireTimer = 0;
    } else if (distanceToPlayer > Config.ENEMY_DETECT_RANGE * 1.5) {
      // Lost player, return to patrol
      this.enemy.state = AIStates.PATROL;
    } else {
      // Chase player
      this.enemy.moveTo(this.player.position, deltaTime);
      this.enemy.lastSeenPlayerPos = this.player.position.clone();
    }
  }

  updateAttack(deltaTime) {
    const distanceToPlayer = this.enemy.position.distanceTo(this.player.position);

    if (distanceToPlayer > Config.ENEMY_ATTACK_RANGE * 1.2) {
      // Player moved away, chase
      this.enemy.state = AIStates.CHASE;
      return;
    }

    // Look at player
    this.enemy.lookAt(this.player.position);

    // Fire at player
    this.fireTimer -= deltaTime;
    if (this.fireTimer <= 0) {
      this.fireAtPlayer();
      this.fireTimer = Config.ENEMY_FIRE_RATE / 1000; // Convert ms to seconds
    }
  }

  checkPlayerDetection() {
    const distanceToPlayer = this.enemy.position.distanceTo(this.player.position);

    if (distanceToPlayer <= Config.ENEMY_DETECT_RANGE) {
      // Check line of sight
      const direction = new THREE.Vector3()
        .subVectors(this.player.position, this.enemy.position)
        .normalize();

      const eyePosition = this.enemy.position.clone();
      eyePosition.y += 1.8; // Eye height

      this.raycaster.set(eyePosition, direction);
      this.raycaster.far = distanceToPlayer;

      // Check if buildings block line of sight
      const buildingHits = this.raycaster.intersectObjects(this.buildingMeshes, true);

      // Only detect if we have clear line of sight (no buildings blocking)
      if (buildingHits.length === 0) {
        if (this.enemy.state === AIStates.PATROL) {
          // Transition to detect state
          this.enemy.state = AIStates.DETECT;
          this.detectionTimer = 0;
        }
      }
    }
  }

  fireAtPlayer() {
    if (!this.player.isAlive) return;

    // Calculate direction to player
    const direction = new THREE.Vector3()
      .subVectors(this.player.position, this.enemy.position)
      .normalize();

    // Add some inaccuracy
    const spread = 0.1;
    direction.x += (Math.random() - 0.5) * spread;
    direction.y += (Math.random() - 0.5) * spread;
    direction.z += (Math.random() - 0.5) * spread;
    direction.normalize();

    // Raycast to check if hit player
    const gunPosition = this.enemy.position.clone();
    gunPosition.y += 1.5; // Gun height

    this.raycaster.set(gunPosition, direction);
    this.raycaster.far = Config.ENEMY_ATTACK_RANGE;

    // Check for building collisions FIRST
    const buildingHits = this.raycaster.intersectObjects(this.buildingMeshes, true);

    if (buildingHits.length > 0) {
      // Hit a building - bullet stops, can't hit player
      const hitPoint = buildingHits[0].point;
      this.createEnemyBulletTrail(direction, hitPoint);
      return; // Don't damage player, bullet was blocked
    }

    // No building in the way, check if player is hit (simple distance check)
    const distanceToPlayer = this.enemy.position.distanceTo(this.player.position);
    if (distanceToPlayer <= Config.ENEMY_ATTACK_RANGE) {
      // Chance to hit based on distance
      const hitChance = 1 - (distanceToPlayer / Config.ENEMY_ATTACK_RANGE);
      if (Math.random() < hitChance) {
        this.player.takeDamage(Config.ENEMY_DAMAGE);
      }
    }

    // Visual effect (bullet trail from enemy to player)
    this.createEnemyBulletTrail(direction, null);
  }

  createEnemyBulletTrail(direction, hitPoint = null) {
    const startPos = this.enemy.position.clone();
    startPos.y += 1.5; // Gun height

    // If we hit a building, end at the hit point. Otherwise, use max range.
    const endPos = hitPoint
      ? hitPoint
      : startPos.clone().add(direction.multiplyScalar(Config.ENEMY_ATTACK_RANGE));

    const points = [startPos, endPos];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0xFF006E,
      transparent: true,
      opacity: 0.6
    });

    const line = new THREE.Line(geometry, material);
    this.scene.add(line);

    // Fade out quickly
    let opacity = 0.6;
    const fadeInterval = setInterval(() => {
      opacity -= 0.1;
      material.opacity = opacity;

      if (opacity <= 0) {
        clearInterval(fadeInterval);
        this.scene.remove(line);
        geometry.dispose();
        material.dispose();
      }
    }, 16);
  }

  // Set building meshes for collision detection
  setBuildingMeshes(meshes) {
    this.buildingMeshes = meshes;
  }
}
