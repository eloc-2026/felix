import { Game } from './src/core/Game.js';
import { LoadingManager } from './src/core/LoadingManager.js';

// Initialize loading manager
const loadingManager = new LoadingManager();

// Show loading screen immediately (StarBoy Productions is now part of it)
loadingManager.show();

// Start loading the game
initializeGame();

async function initializeGame() {
  // Set total loading items
  loadingManager.setTotal(8);

  // Simulate loading different systems
  await loadingManager.loadResource('Core Systems', 200);
  await loadingManager.loadResource('Graphics Engine', 300);
  await loadingManager.loadResource('Scene Manager', 250);

  // Create the game (this initializes all systems)
  loadingManager.setStatus('Building game world...');
  const game = new Game(loadingManager);

  await loadingManager.loadResource('Player Systems', 200);
  await loadingManager.loadResource('Weapon Systems', 250);
  await loadingManager.loadResource('Audio Engine', 200);
  await loadingManager.loadResource('Environment', 300);
  await loadingManager.loadResource('Post-Processing', 200);

  // When loading is complete, the loading manager will hide automatically
  loadingManager.onComplete(() => {
    console.log('All systems loaded!');
  });

  // Handle page unload
  window.addEventListener('beforeunload', () => {
    game.dispose();
  });
}

