import { Weapon } from './Weapon.js';
import { WeaponConfig } from './WeaponConfig.js';

export class Rifle extends Weapon {
  constructor() {
    super(WeaponConfig.RIFLE);
  }
}
