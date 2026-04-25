import EventBus from '../utils/EventBus.js';

export class AudioSystem {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
    this.masterGain.gain.value = 0.3; // Master volume

    // Track playing sounds for cleanup
    this.activeSounds = [];

    // Ambient music state
    this.ambientOscillator = null;
    this.isPlayingAmbient = false;

    this.setupEventListeners();
  }

  setupEventListeners() {
    EventBus.on('weapon:fire', (data) => this.playWeaponSound(data.weaponType));
    EventBus.on('weapon:reload-start', () => this.playReloadSound());
    EventBus.on('player:damage', () => this.playDamageSound());
    EventBus.on('enemy:death', () => this.playEnemyDeathSound());
    EventBus.on('player:kill', () => this.playKillSound());
    EventBus.on('player:footstep', () => this.playFootstepSound());
  }

  // Play footstep sound
  playFootstepSound() {
    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGain);

    const osc = this.createOscillator(60, 'sine');
    osc.connect(gainNode);

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.05, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Create a simple oscillator-based sound
  createOscillator(frequency, type = 'sine') {
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    return oscillator;
  }

  // Create an envelope (ADSR)
  createEnvelope(gainNode, attackTime, decayTime, sustainLevel, releaseTime) {
    const now = this.audioContext.currentTime;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + attackTime);
    gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);

    setTimeout(() => {
      const releaseStart = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(sustainLevel, releaseStart);
      gainNode.gain.linearRampToValueAtTime(0, releaseStart + releaseTime);
    }, (attackTime + decayTime) * 1000);
  }

  // Play weapon fire sound
  playWeaponSound(weaponType = 'Pistol') {
    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGain);

    let baseFreq, oscType, duration;

    switch(weaponType) {
      case 'Pistol':
        baseFreq = 150;
        oscType = 'square';
        duration = 0.08;
        break;
      case 'Rifle':
        baseFreq = 120;
        oscType = 'sawtooth';
        duration = 0.1;
        break;
      case 'Shotgun':
        baseFreq = 80;
        oscType = 'sawtooth';
        duration = 0.15;
        break;
      case 'Sniper':
        baseFreq = 100;
        oscType = 'square';
        duration = 0.2;
        break;
      default:
        baseFreq = 150;
        oscType = 'square';
        duration = 0.08;
    }

    // Create noise for gunshot
    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.audioContext.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = baseFreq * 2;
    noiseFilter.Q.value = 1;

    const noiseGain = this.audioContext.createGain();
    noiseGain.gain.value = 0.3;

    // Bass thump
    const bass = this.createOscillator(baseFreq, oscType);
    const bassGain = this.audioContext.createGain();
    bassGain.gain.value = 0.5;

    // Connect everything
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(gainNode);

    bass.connect(bassGain);
    bassGain.connect(gainNode);

    // Envelope
    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Start and stop
    noise.start(now);
    bass.start(now);
    noise.stop(now + duration);
    bass.stop(now + duration);
  }

  // Play reload sound
  playReloadSound() {
    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGain);

    // Click sound
    const click = this.createOscillator(200, 'square');
    const clickGain = this.audioContext.createGain();

    click.connect(clickGain);
    clickGain.connect(gainNode);

    const now = this.audioContext.currentTime;

    // Quick click
    clickGain.gain.setValueAtTime(0.3, now);
    clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    click.start(now);
    click.stop(now + 0.05);

    // Second click
    setTimeout(() => {
      const click2 = this.createOscillator(180, 'square');
      const click2Gain = this.audioContext.createGain();
      click2.connect(click2Gain);
      click2Gain.connect(gainNode);

      const now2 = this.audioContext.currentTime;
      click2Gain.gain.setValueAtTime(0.3, now2);
      click2Gain.gain.exponentialRampToValueAtTime(0.01, now2 + 0.05);
      click2.start(now2);
      click2.stop(now2 + 0.05);
    }, 200);
  }

  // Play damage sound (player hit)
  playDamageSound() {
    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGain);

    const osc = this.createOscillator(80, 'sawtooth');
    osc.connect(gainNode);

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.4, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // Play enemy death sound
  playEnemyDeathSound() {
    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGain);

    const osc = this.createOscillator(200, 'sawtooth');
    osc.connect(gainNode);

    const now = this.audioContext.currentTime;
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Play kill confirmed sound
  playKillSound() {
    const gainNode = this.audioContext.createGain();
    gainNode.connect(this.masterGain);

    // Nice arpeggio for kill
    const notes = [523.25, 659.25, 783.99]; // C, E, G

    notes.forEach((freq, i) => {
      setTimeout(() => {
        const osc = this.createOscillator(freq, 'sine');
        const oscGain = this.audioContext.createGain();
        osc.connect(oscGain);
        oscGain.connect(gainNode);

        const now = this.audioContext.currentTime;
        oscGain.gain.setValueAtTime(0.15, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);
      }, i * 50);
    });
  }

  // Start ambient background music
  startAmbientMusic() {
    if (this.isPlayingAmbient) return;
    this.isPlayingAmbient = true;

    // Dark cyberpunk ambient drone
    const createDrone = (frequency, detune = 0) => {
      const osc = this.audioContext.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = frequency;
      osc.detune.value = detune;

      const gain = this.audioContext.createGain();
      gain.gain.value = 0.03; // Very quiet

      const filter = this.audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 500;
      filter.Q.value = 1;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      return { osc, gain, filter };
    };

    // Multiple low drones for atmosphere
    this.drones = [
      createDrone(55, 0),    // A1
      createDrone(55, -5),   // Slightly detuned
      createDrone(82.41, 0), // E2
      createDrone(110, 3)    // A2 slightly sharp
    ];

    // Slowly modulate filter
    const modulateDrones = () => {
      if (!this.isPlayingAmbient) return;

      this.drones.forEach((drone, i) => {
        const lfo = Math.sin(Date.now() / 1000 + i) * 200 + 500;
        drone.filter.frequency.setValueAtTime(lfo, this.audioContext.currentTime);
      });

      requestAnimationFrame(modulateDrones);
    };
    modulateDrones();
  }

  stopAmbientMusic() {
    if (!this.isPlayingAmbient) return;
    this.isPlayingAmbient = false;

    if (this.drones) {
      this.drones.forEach(drone => {
        drone.osc.stop();
      });
      this.drones = null;
    }
  }

  // Resume audio context (required for browser autoplay policies)
  resume() {
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  dispose() {
    this.stopAmbientMusic();
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
