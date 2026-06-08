export class HitMarkerSystem {
  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'hitmarker-container';
    this.container.style.position = 'fixed';
    this.container.style.top = '0';
    this.container.style.left = '0';
    this.container.style.width = '100%';
    this.container.style.height = '100%';
    this.container.style.pointerEvents = 'none';
    this.container.style.zIndex = '200';
    document.body.appendChild(this.container);
  }

  showHitMarker(isKill = false, isHeadshot = false) {
    const marker = document.createElement('div');

    // Determine marker class based on type
    let markerClass = 'hitmarker';
    if (isKill) markerClass += ' kill';
    if (isHeadshot) markerClass += ' headshot';

    marker.className = markerClass;
    marker.innerHTML = `
      <div class="hitmarker-line hitmarker-line-1"></div>
      <div class="hitmarker-line hitmarker-line-2"></div>
      <div class="hitmarker-line hitmarker-line-3"></div>
      <div class="hitmarker-line hitmarker-line-4"></div>
    `;

    this.container.appendChild(marker);

    // Remove after animation
    setTimeout(() => {
      marker.remove();
    }, 300);
  }

  dispose() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }
}
