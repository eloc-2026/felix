export class SettingsManager {
  constructor() {
    this.settings = {
      map: 'cyberpunk',
      quality: 'medium',      // Changed from 'high' for better performance
      bloom: true,
      chromatic: false,       // Disabled by default for performance
      vignette: true,
      shadows: false          // Disabled by default for performance
    };

    this.listeners = [];
    this.setupUI();
    this.loadSettings();
  }

  setupUI() {
    // Settings button
    const settingsBtn = document.getElementById('settings-btn');
    const settingsScreen = document.getElementById('settings-screen');
    const startScreen = document.getElementById('start-screen');
    const backBtn = document.getElementById('back-btn');

    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      startScreen.classList.add('hidden');
      settingsScreen.classList.remove('hidden');
    });

    backBtn.addEventListener('click', () => {
      settingsScreen.classList.add('hidden');
      startScreen.classList.remove('hidden');
      this.saveSettings();
    });

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        // Update active states
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show correct tab content
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        document.getElementById(`${tab}-tab`).classList.add('active');
      });
    });

    // Map selection
    const mapBtns = document.querySelectorAll('.map-btn');
    mapBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        mapBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.settings.map = btn.dataset.map;
        this.notifyListeners('map', this.settings.map);
      });
    });

    // Graphics settings
    const qualitySelect = document.getElementById('quality-select');
    qualitySelect.addEventListener('change', () => {
      this.settings.quality = qualitySelect.value;
      this.notifyListeners('quality', this.settings.quality);
    });

    const bloomToggle = document.getElementById('bloom-toggle');
    bloomToggle.addEventListener('change', () => {
      this.settings.bloom = bloomToggle.checked;
      this.notifyListeners('bloom', this.settings.bloom);
    });

    const chromaticToggle = document.getElementById('chromatic-toggle');
    chromaticToggle.addEventListener('change', () => {
      this.settings.chromatic = chromaticToggle.checked;
      this.notifyListeners('chromatic', this.settings.chromatic);
    });

    const vignetteToggle = document.getElementById('vignette-toggle');
    vignetteToggle.addEventListener('change', () => {
      this.settings.vignette = vignetteToggle.checked;
      this.notifyListeners('vignette', this.settings.vignette);
    });

    const shadowsToggle = document.getElementById('shadows-toggle');
    shadowsToggle.addEventListener('change', () => {
      this.settings.shadows = shadowsToggle.checked;
      this.notifyListeners('shadows', this.settings.shadows);
    });
  }

  loadSettings() {
    try {
      const saved = localStorage.getItem('cyberpunk-fps-settings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
        this.applySettingsToUI();
      }
    } catch (e) {
      console.warn('Failed to load settings:', e);
    }
  }

  saveSettings() {
    try {
      localStorage.setItem('cyberpunk-fps-settings', JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }

  applySettingsToUI() {
    // Update map buttons
    document.querySelectorAll('.map-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.map === this.settings.map);
    });

    // Update graphics controls
    document.getElementById('quality-select').value = this.settings.quality;
    document.getElementById('bloom-toggle').checked = this.settings.bloom;
    document.getElementById('chromatic-toggle').checked = this.settings.chromatic;
    document.getElementById('vignette-toggle').checked = this.settings.vignette;
    document.getElementById('shadows-toggle').checked = this.settings.shadows;
  }

  getSettings() {
    return { ...this.settings };
  }

  onSettingChange(callback) {
    this.listeners.push(callback);
  }

  notifyListeners(setting, value) {
    this.listeners.forEach(callback => callback(setting, value));
  }
}
