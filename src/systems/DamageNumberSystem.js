import * as THREE from 'three';

export class DamageNumberSystem {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.numbers = [];
  }

  showDamage(position, damage, isKill = false) {
    // Create HTML element for damage number
    const element = document.createElement('div');
    element.className = isKill ? 'damage-number kill-number' : 'damage-number';
    element.textContent = Math.round(damage);
    element.style.position = 'fixed';
    element.style.pointerEvents = 'none';
    element.style.zIndex = '150';
    element.style.fontSize = isKill ? '32px' : '24px';
    element.style.fontWeight = 'bold';
    element.style.color = isKill ? '#00F5FF' : '#FF006E';
    element.style.textShadow = isKill ? '0 0 10px #00F5FF' : '0 0 10px #FF006E';
    element.style.fontFamily = 'monospace';
    element.style.transition = 'all 0.5s ease-out';
    element.style.opacity = '1';

    document.body.appendChild(element);

    // Track this number
    this.numbers.push({
      element,
      position: position.clone(),
      startTime: Date.now(),
      duration: 1000
    });

    // Animate upward and fade
    requestAnimationFrame(() => {
      element.style.transform = 'translateY(-50px)';
      element.style.opacity = '0';
    });

    // Remove after animation
    setTimeout(() => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.numbers = this.numbers.filter(n => n.element !== element);
    }, 1000);
  }

  update() {
    // Update screen positions of damage numbers
    this.numbers.forEach(num => {
      const screenPos = this.toScreenPosition(num.position);
      num.element.style.left = screenPos.x + 'px';
      num.element.style.top = screenPos.y + 'px';
    });
  }

  toScreenPosition(position) {
    const vector = position.clone();
    vector.project(this.camera);

    const x = (vector.x + 1) / 2 * window.innerWidth;
    const y = -(vector.y - 1) / 2 * window.innerHeight;

    return { x, y };
  }

  dispose() {
    this.numbers.forEach(num => {
      if (num.element.parentNode) {
        num.element.parentNode.removeChild(num.element);
      }
    });
    this.numbers = [];
  }
}
