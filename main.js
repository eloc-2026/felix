import { Game } from './src/core/Game.js';

// Create and initialize the game
const game = new Game();

// Handle page unload
window.addEventListener('beforeunload', () => {
  game.dispose();
});
