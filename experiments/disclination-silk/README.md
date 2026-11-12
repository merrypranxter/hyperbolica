# Disclination Silk — ARGON experiment 002

A reduced active nematic grows a retained glass-fiber skeleton. The skeleton develops spring stress; that stress changes the nematic field that guides subsequent growth. Native browser JavaScript and WebGL 1, with a Canvas fallback and no external libraries or services.

## Play

From the repository root:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/experiments/disclination-silk/`. HTTP is needed for browser modules and the local palette fetch; do not open through `file://`. The existing `npm run dev` route works at port 5173. `npm run build` includes the original app and both ARGON experiments.

## An experiment to try

Let fibers grow for a few seconds. Turn **Stress → director** down to zero: fibers still stretch, but their stress no longer reorients Q. Raise it to restore that causal path. Set **Fiber spring stiffness** to zero to remove Hookean stress while retaining paths. Set **Fiber growth** to zero to stop new nodes while existing chains continue to move and strain.

Reverse **Active stress** to change the flow closure. Increase **Orientational elasticity** to favor smooth alignment. Move **Nutrient reservoir** toward zero to starve growth gradually. Rotating the crossed polarizer or changing palettes only changes rendering. The director/defect view shows the measured topological charges; stress view shows spring-derived stress.

Drag to rotate Q, melt local order, or replenish nutrient. Direct gestures edit material even when automatic evolution is paused. Space toggles pause outside a control. Mutate changes structural parameters and seed, clearing the material history; Regrow restarts the displayed seed using current parameters. Quality changes also restart the specimen. Resize retains state. The query string records initial conditions, not a checkpoint or a gesture replay.

Save PNG captures the art canvas, named by seed and simulation step. All 180 existing palette IDs are available beside the source palette. No original palette or artwork is modified.

## What the mathematics actually does

The field is the symmetric traceless tensor

```text
Q = [[q1, q2], [q2, −q1]]
theta = ½ atan2(q2, q1)
```

`theta` is a director: directions separated by π represent the same orientation. A periodic Fourier perturbation supplies initial order; no moving defect positions are prescribed after initialization. At every fourth simulation step, the code sums wrapped changes of `arg(q1 + i q2)` around each lattice plaquette. A full winding in Q corresponds to a ±½ nematic defect. Detection positions are cell centers, so motion has lattice resolution. Fibers are initially seeded partly near detected cores; their later tips follow Q with sign-continuous direction, and grow somewhat faster in low-order regions. They do not explicitly chase or attach to tracked defect identities.

The **dry, compressible, substrate-friction** velocity closure is

```text
v_raw = 4 ζ div(Q) / (1 + 2.8 ρ)
```

It is locally smoothed and component-limited to ±3 lattice cells per time unit. Q is semi-Lagrangian advected, then updated with bulk relaxation, orientational elasticity, a reduced flow-alignment term, fiber-stress feedback and corotation:

```text
D_t q = 0.85 (1−|q|²) q + K Δq + 0.48 E_tr + χ σ_tr/(1+|σ_tr|)
q rotates by 2 omega dt
```

The lattice spacing is one; the fixed time step is `0.04`. Order amplitude is guarded at `1.3` for numerical robustness. These coefficients and guards are phenomenological choices. There is no pressure/incompressibility solve, inertial fluid, full Beris–Edwards tensor closure or calibrated material free energy. This system can move and annihilate defects; it does not promise sustained defect creation at every parameter setting.

Nutrient diffuses and relaxes toward the user-set reservoir:

```text
∂t n = 0.2 Δn + 0.12 (reservoir − n)
tip speed = 4.5 growth n [1 + 0.65 exp(−|q|²/0.18)]
```

Tip direction follows the leading eigenvector with sign continuity and finite directional persistence. A retained node is deposited after about half a lattice cell of travel. Depositing a segment of length `L` consumes `0.035 L` nutrient locally. This is a bounded resource model, not exact global chemical mass conservation.

## The mechanical bridge is computed, not painted

Each fiber is a stored spring chain. Its first point is pinned. Other nodes advect with 0.6 times the substrate velocity, retain weak anchors to their deposition positions, and undergo one overdamped Hookean relaxation sweep per step. Each segment stores its rest length at deposition.

For segment tangent `t`, current length `L` and stored rest length `L0`:

```text
strain = (L − L0) / L0
force = stiffness × strain
sigma_tr = 2 sum(force × L × [tx² − ty², 2tx ty])
```

The code bilinearly deposits this signed, traceless, virial-like stress onto the field. It enters the **next Q update** and changes future trajectories. Fiber density also increases substrate friction. These are two distinct return paths; zeroing stress feedback does not remove density-dependent drag. Tension/compression therefore has actual stored-state consequences beyond changing appearance.

This is not a contact-resolving textile. Fibers have no bending energy, contact, topological over/under rules, crosslink mechanics or 3D geometry. Crossings may pass through one another. The first-node anchoring is a substrate modeling choice, not a mechanically equilibrated global fabric network.

## Rendering

The background reads Q for crossed-polarizer extinction, local orientation glyphs and a three-wavelength interference-inspired phase. Actual retained segments are tessellated into narrow ribbon quads with rounded-cross-section lighting and fine optical striations. Segment extension affects their retardance and width. A diagnostic stress map reads the deposited tensor magnitude; colored ± glyphs display measured defect winding.

There is **no time uniform** in the shaders. Animation changes because stored order, stress and geometry change. Microscopic director marks are Q visualizations, not invented independent fiber paths. Ribbon shading, Fresnel-like edge color and spectral phases are artistic approximations; no full polarization transport, physical birefringence calibration, refraction or caustic ray transport is claimed.

Signed mechanical stress is retained without display clipping. The texture encodes `min(1,2|sigma_tr|)` and ribbon tension encodes `min(1,8|force|)` for visualization; those display saturations are not limits on the mechanical arrays.

## Bounded growth and quality

| Tier | Q lattice | Retained fibers | Maximum nodes per fiber | Display pixel cap |
|---|---:|---:|---:|---:|
| Mobile | 72² | 46 | 120 | 260,000 |
| Balanced | 104² | 67 | 120 | 500,000 |
| Fine | 144² | 93 | 120 | 850,000 |

Once a fiber reaches its node budget, it stops extending; its stored nodes continue deforming and generating stress. Paths are not silently deleted to make an endless scrolling texture. Regrow clears the archive. These are distinct lattice sizes with different numbers of retained fibers, not a continuum-convergence claim. Mobile/coarse-pointer devices default to Mobile.

The frame scheduler budgets CPU work and caps catch-up. Speed requests more fixed steps; slow devices may progress more slowly than the requested wall-clock speed. Background tabs stop evolving. Reduced-motion users start paused. Float32 arrays hold state; ordinary RGBA8 textures are only a display transport, avoiding floating-point framebuffer requirements. Fragment highp is checked, with mediump shader support; absent/failed WebGL falls back to a simpler Canvas map and actual paths. Append `?flat=1` to select it explicitly. Context restoration retains simulation arrays and reconstructs graphics resources.

## Files and later integration

- `simulation.js`: `NematicSilkSimulation(size, seed, params, options)`, `step`, `reset`, `inject`, `stats`, `encode`; no browser dependencies.
- `renderer.js`, `shaders.js`: checked WebGL programs and reduced Canvas renderer. `.draw()` does not advance state.
- `main.js`: fixed-step scheduling, interaction, source/shared palettes, reset/mutation, graphics lifecycle and PNG export.
- `index.html`, `style.css`: independent responsive ARGON interface.
- `../../tests/silk.test.mjs`: deterministic field/geometry, winding, defect motion, computed stress, feedback ablation, finite/bounded state, resource consumption and growth stop.

For Three.js integration, upload `encode()` to an RGBA DataTexture with clamp wrapping, linear display filtering and no mipmaps: `R=(q1+1.5)/3`, `G=(q2+1.5)/3`, `B=normalized stress magnitude`, `A=fiber density`. Preserve the actual arrays for evolution. Fibers expose retained points in normalized periodic material coordinates; skip seam-spanning display segments rather than drawing false long threads. The field and springs are periodic, but display shows one bounded material square. A world-to-material transform is needed to attach this to a moving 3D object. Do not reuse RGB optical history as Q state.

## Verification status

Six numerical tests passed; the original static and experiment 001 test files also passed. Independent source/numerical review checked default and extreme-control runs, actual strain-derived stress, feedback ablation and mobile defects. `npm run build` passed with all three entry routes.

Chromium/Playwright with SwiftShader software WebGL compiled the actual programs and exercised visible growth, pause, source/shared palettes, read-only polarizer changes, melt gestures, PNG, mutation and graphics-context restoration. Further checks passed for touch feeding, quality reset, zero-speed regrowth, deterministic restart and a genuine absent-WebGL Canvas fallback. The production route loaded all 180 shared palettes, served its emitted model guide, grew to 2,671 retained segments and exported a PNG; the experiment 001 route remained present. Final browser runs had no relevant console errors or failed resources.

Desktop viewports 1440×1080 and 1280×900 and a mobile viewport 390×844 were checked. Screenshots were visually inspected for specimen framing, readable glass ribbons, palette/negative-space balance, control typography, desktop sidebar layout, mobile stacking and overflow. Ribbons were widened and optical striation frequency reduced after the first render looked too faint. No image reference was supplied; these checks follow the requested material-art direction and established ARGON interface. The observed software rendering was roughly 10–15 drawn frames/s in the displayed runs, not a calibrated hardware benchmark.

The Browser plugin is unavailable, so browser checks use regular Playwright. A physical GPU and iPhone Safari have not been tested. Software-renderer timing and CPU numerical timing do not establish real-device performance. Existing Hyperbolica engines and experiment 001 remain intact. No deployment or main-branch replacement is involved.
