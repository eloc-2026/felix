export class SniperScopeSystem {
  constructor() {
    this.scopeElement = document.getElementById('sniper-scope');
    this.breathTime = 0;
    this.isActive = false;
  }

  setActive(active) {
    this.isActive = active;
    if (!active) {
      // Reset position when deactivated
      if (this.scopeElement) {
        this.scopeElement.style.transform = '';
      }
    }
  }

  update(deltaTime) {
    if (!this.isActive || !this.scopeElement) return;

    this.breathTime += deltaTime;

    // Simulate breathing sway
    const breathCycle = Math.sin(this.breathTime * 0.8) * 2; // Slow breath
    const microShake = Math.sin(this.breathTime * 15) * 0.3; // Slight hand shake

    const offsetX = breathCycle + microShake;
    const offsetY = Math.cos(this.breathTime * 0.8) * 1.5 + microShake * 0.5;

    this.scopeElement.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
  }

  reset() {
    this.breathTime = 0;
    if (this.scopeElement) {
      this.scopeElement.style.transform = '';
    }
  }
}
