# Disclination Silk implementation plan

Goal: implement the approved second experiment from `ARGON-audit-and-engines.md` as a separately playable native-browser artifact.

Architecture: a reduced 2D active Q-tensor model drives retained fiber tips. Fiber nodes are advected and elastically relaxed; extension-derived stress feeds back into Q and optical retardance. Raw WebGL 1 renders the field and actual fiber segments; Canvas provides a reduced fallback. This is not a calibrated hydrodynamic or textile solver.

Constraints: preserve all existing engines and experiment 001; no dependencies, deployment or main-branch replacement; shared 194 palettes plus source colors; pause, speed, structural mutation, seed, quality and PNG. Work on `feature/argon-disclination-silk`.

1. Create `experiments/disclination-silk/simulation.js` and numerical tests: deterministic Q evolution, mobile detected defects, bounded finite state, retained fiber paths, actual spring stress and feedback ablation. Fixed substeps, periodic field boundaries, bounded fiber memory.
2. Create `renderer.js` and `shaders.js`: interpolate Q state for crossed-polarizer background; draw retained fiber segments as lit ribbons, using computed tension for optical response. Check shader compilation and link status; provide a Canvas fallback.
3. Create `index.html`, `style.css`, `main.js`: use the established ARGON interface with dynamic controls for activity, elasticity, growth, spring stiffness and stress feedback; seed/mutate/pause/speed, quality, palette, polarizer, diagnostic views and PNG. Add a separate Vite entry without changing existing engine behavior.
4. Run numerical tests and build, then Chromium browser validation because the Browser plugin is unavailable. Inspect desktop/mobile screenshots; check visible evolution, pause, source/shared palettes, brush interactions, PNG, reseed, context restoration and no-WebGL fallback. Document software-renderer versus physical-device limits. Commit and publish only the separate feature branch; deliver a source archive and run instructions.

Review focus: do not confuse prescribed initial defects with evolved defects; do not label orientation density as mechanical stress; pause and speed zero must stop automatic state changes; quality/reseed must clearly reset history; device failures must retain meaningful Canvas evolution. Growing or retaining arbitrary numbers of fibers must not grow memory without bound.
