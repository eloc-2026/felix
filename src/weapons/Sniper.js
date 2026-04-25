import { Weapon } from './Weapon.js';
import { WeaponConfig } from './WeaponConfig.js';

export class Sniper extends Weapon {
  constructor() {
    super(WeaponConfig.SNIPER);
  }
}
