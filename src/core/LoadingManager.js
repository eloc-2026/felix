export class LoadingManager {
  constructor() {
    this.totalItems = 0;
    this.loadedItems = 0;
    this.currentStatus = 'Initializing...';
    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingBar = document.getElementById('loading-bar');
    this.loadingPercentage = document.getElementById('loading-percentage');
    this.loadingStatus = document.getElementById('loading-status');

    this.onCompleteCallback = null;
  }

  show() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.remove('hidden');
    }
  }

  hide() {
    if (this.loadingScreen) {
      setTimeout(() => {
        this.loadingScreen.classList.add('hidden');
        if (this.onCompleteCallback) {
          this.onCompleteCallback();
        }
      }, 500); // Delay for visual effect
    }
  }

  setTotal(total) {
    this.totalItems = total;
  }

  setStatus(status) {
    this.currentStatus = status;
    if (this.loadingStatus) {
      this.loadingStatus.textContent = status;
    }
  }

  addItem() {
    this.loadedItems++;
    this.updateProgress();
  }

  updateProgress() {
    const progress = this.totalItems > 0
      ? Math.min((this.loadedItems / this.totalItems) * 100, 100)
      : 0;

    if (this.loadingBar) {
      this.loadingBar.style.width = `${progress}%`;
    }

    if (this.loadingPercentage) {
      this.loadingPercentage.textContent = `${Math.floor(progress)}%`;
    }

    // Check if loading is complete
    if (progress >= 100) {
      this.setStatus('Loading complete!');
      setTimeout(() => {
        this.hide();
      }, 800);
    }
  }

  // Simulate loading a resource with a delay
  async loadResource(name, duration = 100) {
    this.setStatus(`Loading ${name}...`);

    return new Promise(resolve => {
      setTimeout(() => {
        this.addItem();
        resolve();
      }, duration);
    });
  }

  onComplete(callback) {
    this.onCompleteCallback = callback;
  }
}
