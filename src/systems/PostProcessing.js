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

    // Bloom effect for neon glow
    const bloomEffect = new BloomEffect({
      intensity: 1.5,
      luminanceThreshold: 0.3,
      luminanceSmoothing: 0.9,
      mipmapBlur: true
    });

    // Chromatic aberration for edge distortion
    const chromaticAberrationEffect = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.002, 0.002)
    });

    // Vignette for focus
    const vignetteEffect = new VignetteEffect({
      darkness: 0.5,
      offset: 0.2
    });

    // Add effects pass
    const effectPass = new EffectPass(
      camera,
      bloomEffect,
      chromaticAberrationEffect,
      vignetteEffect
    );
    this.composer.addPass(effectPass);

    // Store effects for later modification
    this.bloomEffect = bloomEffect;
    this.chromaticAberrationEffect = chromaticAberrationEffect;
    this.vignetteEffect = vignetteEffect;
  }

  render(deltaTime) {
    this.composer.render(deltaTime);
  }

  setVignetteDarkness(darkness) {
    this.vignetteEffect.uniforms.get('darkness').value = darkness;
  }

  onResize() {
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose() {
    this.composer.dispose();
  }
}
