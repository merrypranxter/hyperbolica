/**
 * HYPER-WEAVE PACK II // PLUG-AND-PLAY JS ENGINE CARTRIDGE (HyperWeavePack2.js)
 * Compatible with any multi-engine WebGL / React / Three.js router.
 * Includes Engines 05 - 08:
 *   - Engine 05 (morph 0.0): Poincaré Hyperbolic Girih Tiling & Non-Euclidean Lace
 *   - Engine 06 (morph 1.0): Abyssal Catacaustic Photon Networks & Neovius Gem Facets
 *   - Engine 07 (morph 2.0): Jacquard Hyper-Loom Brocade Weave & Memphis Glitch Matrix
 *   - Engine 08 (morph 3.0): Belousov-Zhabotinsky Scroll Waves & Lichtenberg Mycelium
 */

export const HYPER_WEAVE_PACK2_ENGINES = [
  { id: 'e5_hyperbolic_girih', index: 0.0, name: 'Poincaré Hyperbolic Girih Tiling & Lace' },
  { id: 'e6_caustic_neovius',  index: 1.0, name: 'Abyssal Catacaustic Photon Web & Neovius Gem' },
  { id: 'e7_jacquard_memphis', index: 2.0, name: 'Jacquard Hyper-Loom Brocade & Memphis Matrix' },
  { id: 'e8_bz_mycelium',      index: 3.0, name: 'Belousov-Zhabotinsky Scroll Waves & Mycelium' }
];

export const HYPER_WEAVE_PACK2_DEFAULT_STATE = {
  "engineMorph": 0,
  "symmetry": 14,
  "depth": 10,
  "detailFreq": 15,
  "tension": 2.4,
  "phaseShift": 0.99,
  "acidOverdrive": 2.85,
  "inkWeight": 1.15,
  "engravingMix": 0.52,
  "dispersion": 0.75,
  "flowSpeed": 0.8,
  "swarmDensity": 1,
  "swarmEnabled": true,
  "paused": false,
  "zoom": 0.39,
  "mouseX": 0,
  "mouseY": 0,
  "targetMouseX": 0,
  "targetMouseY": 0
};

export const HYPER_WEAVE_PACK2_PRESETS = {
  "poincareGirihCathedral": {
    "engineMorph": 0,
    "symmetry": 7,
    "depth": 9,
    "detailFreq": 11.5,
    "tension": 1.45,
    "phaseShift": 0,
    "acidOverdrive": 2.25,
    "inkWeight": 0.95,
    "engravingMix": 0.32,
    "dispersion": 0.3,
    "flowSpeed": 0.75,
    "swarmDensity": 0.85
  },
  "abyssalDichroicCaustic": {
    "engineMorph": 1,
    "symmetry": 9,
    "depth": 10,
    "detailFreq": 13,
    "tension": 2.15,
    "phaseShift": 0.18,
    "acidOverdrive": 2.55,
    "inkWeight": 1.1,
    "engravingMix": 0.18,
    "dispersion": 0.48,
    "flowSpeed": 0.85,
    "swarmDensity": 0.7
  },
  "memphisJacquardBrocade": {
    "engineMorph": 2,
    "symmetry": 8,
    "depth": 8,
    "detailFreq": 16.5,
    "tension": 1.25,
    "phaseShift": 0.42,
    "acidOverdrive": 2.4,
    "inkWeight": 1.15,
    "engravingMix": 0.45,
    "dispersion": 0.36,
    "flowSpeed": 0.65,
    "swarmDensity": 0.95
  },
  "belousovMycelialLightning": {
    "engineMorph": 3,
    "symmetry": 10,
    "depth": 11,
    "detailFreq": 14,
    "tension": 1.85,
    "phaseShift": 0.68,
    "acidOverdrive": 2.65,
    "inkWeight": 1.05,
    "engravingMix": 0.25,
    "dispersion": 0.35,
    "flowSpeed": 0.9,
    "swarmDensity": 1.1
  },
  "nonEuclideanHalftoneRosette": {
    "engineMorph": 0.35,
    "symmetry": 12,
    "depth": 12,
    "detailFreq": 18,
    "tension": 1.65,
    "phaseShift": 0.82,
    "acidOverdrive": 2.75,
    "inkWeight": 1.3,
    "engravingMix": 0.88,
    "dispersion": 0.62,
    "flowSpeed": 0.6,
    "swarmDensity": 1.2
  },
  "hyperChromaticCausticLoom": {
    "engineMorph": 1.52,
    "symmetry": 14,
    "depth": 10,
    "detailFreq": 15,
    "tension": 2.4,
    "phaseShift": 0.54,
    "acidOverdrive": 2.85,
    "inkWeight": 1.15,
    "engravingMix": 0.52,
    "dispersion": 0.75,
    "flowSpeed": 0.8,
    "swarmDensity": 1
  }
};

export class HyperWeavePack2Cartridge {
  constructor(glContext, fragmentShaderSource) {
    this.gl = glContext;
    this.fragmentSource = fragmentShaderSource;
    this.uniforms = { ...HYPER_WEAVE_PACK2_DEFAULT_STATE };
  }

  selectEngine(engineIndex) {
    this.uniforms.engineMorph = Math.max(0.0, Math.min(3.0, Number(engineIndex)));
  }

  applyPreset(presetKey) {
    if (HYPER_WEAVE_PACK2_PRESETS[presetKey]) {
      Object.assign(this.uniforms, HYPER_WEAVE_PACK2_PRESETS[presetKey]);
    }
  }
}