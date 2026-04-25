import { Weapon } from './Weapon.js';
import { WeaponConfig } from './WeaponConfig.js';

export class Pistol extends Weapon {
  constructor() {
    super(WeaponConfig.PISTOL);
  }
}
