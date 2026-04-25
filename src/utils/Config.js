// Game configuration constants
export const Config = {
  // Player settings
  PLAYER_HEIGHT: 1.8,
  PLAYER_SPEED: 5,
  PLAYER_MAX_HEALTH: 100,
  MOUSE_SENSITIVITY: 0.002,

  // Physics
  GRAVITY: -9.81,
  FIXED_TIMESTEP: 1 / 60,

  // Cyberpunk colors
  COLORS: {
    NEON_PINK: 0xFF006E,
    NEON_CYAN: 0x00F5FF,
    NEON_PURPLE: 0x8B00FF,
    DARK_BLUE: 0x0A0E27,
    FLOOR_GRID: 0x00F5FF
  },

  // Enemy settings
  ENEMY_HEALTH: 100,
  ENEMY_SPEED: 3,
  ENEMY_DETECT_RANGE: 15,
  ENEMY_ATTACK_RANGE: 10,
  ENEMY_DAMAGE: 10,
  ENEMY_FIRE_RATE: 1000, // ms between shots

  // World
  WORLD_SIZE: 100,
  BUILDING_COUNT: 20
};
