import * as THREE from 'three';
import { Config } from '../utils/Config.js';

export class NeonMaterials {
  static createNeonMaterial(color, emissiveIntensity = 2) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: emissiveIntensity,
      roughness: 0.2,
      metalness: 0.8
    });
  }

  static createGlowingEdge(color, emissiveIntensity = 3) {
    return new THREE.MeshBasicMaterial({
      color: color,
      fog: false
    });
  }

  static createBuildingMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      roughness: 0.9,
      metalness: 0.1
    });
  }

  static createNeonTrim(color) {
    return new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 4,
      roughness: 0.1,
      metalness: 0.9,
      toneMapped: false
    });
  }

  static getPink() {
    return this.createNeonMaterial(Config.COLORS.NEON_PINK);
  }

  static getCyan() {
    return this.createNeonMaterial(Config.COLORS.NEON_CYAN);
  }

  static getPurple() {
    return this.createNeonMaterial(Config.COLORS.NEON_PURPLE);
  }
}
