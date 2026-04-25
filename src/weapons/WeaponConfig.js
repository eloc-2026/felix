export const WeaponConfig = {
  PISTOL: {
    name: 'Pistol',
    damage: 25,
    fireRate: 600, // rounds per minute
    magazineSize: 12,
    reserveAmmo: 60,
    reloadTime: 1.5, // seconds
    muzzleVelocity: 300, // m/s
    recoilPattern: [
      { x: 0, y: -0.015 },
      { x: 0.005, y: -0.015 },
      { x: -0.005, y: -0.015 }
    ],
    recoilRecovery: 0.2,
    spread: 0.01, // radians
    range: 50,
    bulletDrop: 0.5 // gravity multiplier
  },

  RIFLE: {
    name: 'Rifle',
    damage: 35,
    fireRate: 450,
    magazineSize: 30,
    reserveAmmo: 120,
    reloadTime: 2.0,
    muzzleVelocity: 600,
    recoilPattern: [
      { x: 0, y: -0.02 },
      { x: 0.005, y: -0.02 },
      { x: -0.005, y: -0.025 },
      { x: 0.008, y: -0.02 },
      { x: -0.008, y: -0.025 }
    ],
    recoilRecovery: 0.18,
    spread: 0.008,
    range: 100,
    bulletDrop: 0.8
  },

  SHOTGUN: {
    name: 'Shotgun',
    damage: 15, // per pellet
    pelletCount: 8,
    fireRate: 120,
    magazineSize: 6,
    reserveAmmo: 24,
    reloadTime: 2.5,
    muzzleVelocity: 400,
    recoilPattern: [
      { x: 0, y: -0.08 }
    ],
    recoilRecovery: 0.12,
    spread: 0.08, // wide spread
    range: 30,
    bulletDrop: 0.3
  },

  SNIPER: {
    name: 'Sniper',
    damage: 100,
    fireRate: 60,
    magazineSize: 5,
    reserveAmmo: 20,
    reloadTime: 3.0,
    muzzleVelocity: 900,
    recoilPattern: [
      { x: 0, y: -0.1 }
    ],
    recoilRecovery: 0.08,
    spread: 0.001, // very accurate
    range: 200,
    bulletDrop: 1.2 // significant bullet drop
  }
};
