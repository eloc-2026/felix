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
      { x: 0, y: -0.015 },          // First shot - moderate vertical
      { x: 0.005, y: -0.017 },      // Right pull
      { x: -0.006, y: -0.016 },     // Left pull
      { x: 0.004, y: -0.018 },      // Right again
      { x: -0.005, y: -0.016 }      // Left correction
    ],
    recoilRecovery: 0.30,
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
      { x: 0, y: -0.014 },          // First shot straight up
      { x: 0.002, y: -0.015 },      // Slight right drift
      { x: 0.003, y: -0.016 },      // More right
      { x: 0.002, y: -0.017 },      // Continued up and right
      { x: 0.001, y: -0.018 },      // Settling
      { x: -0.001, y: -0.017 },     // Left correction
      { x: -0.002, y: -0.016 },     // More left
      { x: -0.002, y: -0.015 },     // Stabilizing
      { x: 0, y: -0.014 },          // Center again
      { x: 0.002, y: -0.016 }       // Repeat pattern
    ],
    recoilRecovery: 0.28,
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
      { x: 0, y: -0.07 }            // Heavy vertical kick like real 12-gauge
    ],
    recoilRecovery: 0.15,              // Slower recovery due to heavy kick
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
      { x: 0, y: -0.04 }            // Reduced recoil for better control
    ],
    recoilRecovery: 0.15,              // Faster recovery
    spread: 0.001, // very accurate
    range: 200,
    bulletDrop: 1.2 // significant bullet drop
  }
};
