export const AIStates = {
  PATROL: 'patrol',
  DETECT: 'detect',
  CHASE: 'chase',
  ATTACK: 'attack',
  DEAD: 'dead'
};

export const AIStateConfig = {
  DETECT_DURATION: 0.5, // seconds to react when seeing player
  PATROL_WAIT_TIME: 2.0, // seconds to wait at patrol point
};
