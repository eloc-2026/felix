import { EffectComposer, EffectPass, RenderPass } from 'postprocessing';
import { BloomEffect, ChromaticAberrationEffect, VignetteEffect } from 'postprocessing';
import * as THREE from 'three';

export class PostProcessingSystem {
  constructor(renderer, scene, camera) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;

    // Create composer
    this.composer = new EffectComposer(renderer);

    // Add render pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // Optimized bloom effect - lower intensity for performance
    this.bloomEffect = new BloomEffect({
      intensity: 0.8,
      luminanceThreshold: 0.4,
      luminanceSmoothing: 0.7,
      mipmapBlur: false  // Disabled for performance
    });

    // Reduced chromatic aberration
    this.chromaticAberrationEffect = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.001, 0.001)  // Reduced from 0.002
    });

    // Lighter vignette
    this.vignetteEffect = new VignetteEffect({
      darkness: 0.3,  // Reduced from 0.5
      offset: 0.2
    });

    // Add effects pass with all effects
    this.effectPass = new EffectPass(
      camera,
      this.bloomEffect,
      this.chromaticAberrationEffect,
      this.vignetteEffect
    );
    this.composer.addPass(this.effectPass);

    // Track enabled state
    this.effectsEnabled = {
      bloom: true,
      chromatic: true,
      vignette: true
    };
  }

  render(deltaTime) {
    this.composer.render(deltaTime);
  }

  setVignetteDarkness(darkness) {
    this.vignetteEffect.uniforms.get('darkness').value = darkness;
  }

  setBloomEnabled(enabled) {
    this.effectsEnabled.bloom = enabled;
    this.bloomEffect.blendMode.opacity.value = enabled ? 1 : 0;
  }

  setChromaticEnabled(enabled) {
    this.effectsEnabled.chromatic = enabled;
    const offset = enabled ? new THREE.Vector2(0.002, 0.002) : new THREE.Vector2(0, 0);
    this.chromaticAberrationEffect.offset = offset;
  }

  setVignetteEnabled(enabled) {
    this.effectsEnabled.vignette = enabled;
    this.vignetteEffect.uniforms.get('darkness').value = enabled ? 0.5 : 0;
  }

  setQuality(quality) {
    switch (quality) {
      case 'low':
        this.bloomEffect.intensity = 0.5;
        this.bloomEffect.mipmapBlur = false;
        break;
      case 'medium':
        this.bloomEffect.intensity = 0.8;
        this.bloomEffect.mipmapBlur = false;
        break;
      case 'high':
        this.bloomEffect.intensity = 1.0;
        this.bloomEffect.mipmapBlur = false;  // Disabled for performance
        break;
      case 'ultra':
        this.bloomEffect.intensity = 1.3;
        this.bloomEffect.mipmapBlur = true;
        break;
    }
  }

  onResize() {
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    this.composer.dispose();
  }
}
