# Spinodal Reliquary — ARGON experiment 001

A persistent phase-separating mixture that mineralizes and arrests its own interfaces. Native JavaScript, WebGL 1 and Canvas 2D; no external libraries, generated imagery, services or floating-point render targets. The original Hyperbolica engines and 57 designs remain intact.

## Play

From the repository root, either:

```sh
npm install
npm run dev
```

Open `http://localhost:5173/experiments/spinodal-reliquary/`.

Or run **without any npm dependencies**:

```sh
python3 -m http.server 8000
```

Open `http://localhost:8000/experiments/spinodal-reliquary/`. Browser module/fetch security requires HTTP; opening the HTML through `file://` is insufficient. `npm run build` includes both the original app and this experiment in `dist/`.

## Play the material

1. Start with source spectral silica or any of the 180 shared palettes. Palette changes leave the simulation alone.
2. Set mineral accretion near zero to watch mobile liquid domains rearrange. Raise it toward 0.12 to freeze their moving boundaries into ridges. Give it tens of simulated time units; `τ` measures the simulated age.
3. Increase anisotropy to stretch the phase transport along one direction. Change quench depth to change the separation drive. Neither is a coordinate warp.
4. Raise dissolution to release the trapped domains. The **Deposition memory** view retains the historical material even as current mineral is removed.
5. Drag in the specimen to feed, dissolve or disturb the mixture. Painting is direct state editing and works while paused. A disturbance uses a balanced perturbation to preserve mean concentration.
6. Pause/resume or press Space outside a control. Speed zero also stops automatic evolution. Mutate changes structural parameters and seed, clearing history; Regrow reconstructs the warm-start state for the displayed seed and current parameters.
7. Save PNG exports just the current artwork, named with seed and step count. This is an image, not a serialized simulation checkpoint.

The query string records seed, dynamics controls, quality and palette for reproducible **initial conditions**. A changed seed/control configuration is reproducible when regrown with the same grid, not a replay of earlier live gestures. Resize preserves state. Changing quality explicitly restarts it; different grids have different numbers of physical lattice sites and therefore different morphology, not converged samples of a fixed-size continuum.

## Actual equations and causal links

State is four Float32 arrays on a periodic square lattice (`dx = 1`): phase concentration `c`, mineral occupancy `s`, nutrient `n`, and accumulated deposition `h`. Rendering crops this periodic material to a circular specimen; the visual cut edge is **not** a no-flux chemical boundary.

```text
μ = c³ − a c − κ Δc
∂t c = ∂x[(1+η) M(s) ∂x μ] + ∂y[(1−η) M(s) ∂y μ]
M(s) = M₀ [0.025 + 0.975 (1−s)³]
∂t n = div[D(s) grad n] + f (1−0.92s)(1−n) − 0.8P + 0.8L
∂t s = P − L
∂t h = 0.7P, bounded at 1
P = r n (1−s) max(0,1−c²)² smoothstep(0.025,0.18,|grad c|)
L = dissolution × s
```

`D` uses symmetric face conductances `3.5[1−0.46(sᵢ+sⱼ)]`; phase mobility also uses symmetric face averages. Opposite fluxes cancel, retaining concentration up to Float32 roundoff. The gradient gate prevents uniformly mineralizing the unseparated initial mixture. Reactions are limited by available nutrient and remaining occupancy. Mineral and nutrient remain in `[0,1]`; phase concentration is not clamped. Accumulated deposition saturates, so it is a bounded optical history rather than an unlimited mass ledger.

The outer step is `0.025`. The explicit fourth-order scheme subdivides it conservatively using quench, interfacial stiffness, mobility and anisotropy. Animation speed requests more of these fixed steps. A per-frame CPU budget and capped backlog favor responsiveness over exact wall-clock simulation speed on slow devices. Background tabs stop evolving.

The initial seeded perturbation is preconditioned with **600 phase-only steps** (15 dimensionless time units). The playable page batches this work between animation frames and reports preparation progress. Nutrient, mineral and history begin pristine; displayed age starts after preparation. No new randomness is injected during evolution.

Three implemented causal links are:

- **Phase → mineral → phase:** interfaces deposit mineral; mineral suppresses mobility, changing subsequent coarsening.
- **Nutrient → mineral → nutrient:** deposition consumes nutrient; mineral reduces nutrient permeability and replenishment.
- **Deposition history → geometry and optics:** retained history changes relief height and three-wavelength film phase even after mineral dissolves.

These are phenomenological constitutive choices. This is neither a calibrated silica model nor a claim that the complete coupled system follows one equilibrium free energy.

## What the renderer does

`shaders.js` ray-intersects an implicit extrusion of the phase field using bounded fixed sampling and bisection; it does **not** sphere-trace a certified signed-distance function. The solid mask is `c > −0.18`; thickness reads `c,s,h`. Normals sample the implicit surface. A small directional visibility probe, local wet specular reflection, Fresnel-like response and a three-wavelength interference approximation produce the material. Chemical concentration and deposition contours add fine lamellar engraving. Film thickness is a stylized function of phase relief, current mineral and deposition history, never wall-clock time.

The scalar-field domains can split, reconnect and disappear as state evolves. This is **2D implicit connectivity changing in a 2.5D rendering**, not 3D volumetric growth, mesh remeshing or independent fiber geometry. There is no full refraction, caustic transport, polarization integration, elasticity or fluid mechanics. The artifact's appearance is a scientific-art interpretation of its state.

## Files / integration

| File | Responsibility |
|---|---|
| `index.html`, `style.css` | Independent playable responsive interface |
| `main.js` | Stable-step scheduler, controls, seed/mutation, palette adapter, pointer mapping, PNG and preparation lifecycle |
| `simulation.js` | Framework-independent model; `step`, `inject`, `stats`, `encode` |
| `renderer.js` | Raw WebGL 1 renderer; checked compilation/linking; reduced Canvas fallback |
| `shaders.js` | Actual vertex and fragment GLSL sources |
| `../../tests/spinodal.test.mjs` | Conservation, reaction balance, deterministic seeds, causal arrest, bounds and history tests |

For later Three.js integration, create one `SpinodalSimulation`, schedule its fixed steps separately from render time, and upload its `encode()` bytes to an RGBA `THREE.DataTexture` with linear filtering, clamp wrapping and no mipmaps. The channels are `R=(c+1.5)/3`, `G=s`, `B=n`, `A=h`. Byte encoding is for display only: numerical updates always use Float32 state. Preserve the channel contract and material-to-world mapping; do not treat alpha as transparency or overwrite the existing RGB optical-history targets. Expose a new engine/preset separately when integration is authorized. The current implementation only adds a separate entry to Vite's build.

Shared palette interpolation follows the existing gamma-coded swatch interpolation convention. Source mode uses spectral silica; shared modes use the artist's selected palette. The original palette JSON is fetched locally, never modified. If unavailable, source colors still work.

## Quality and fallback

| Tier | Simulation | Display cap | Ray samples |
|---|---:|---:|---:|
| Mobile | 112² | 220,000 pixels | 48 |
| Balanced | 176² | 420,000 pixels | 72 |
| Fine | 256² | 900,000 pixels | 112 |

Mobile/coarse-pointer devices default to Mobile. Rendering tries fragment `highp`, using `mediump` if that precision is unsupported. Compile/link failures or absent WebGL use the same evolving simulation in Canvas 2D, without relief optics. Append `?flat=1` to choose that reduced map deliberately. WebGL context loss suspends progression and restoration rebuilds graphics resources while retaining material arrays. Reduced-motion users start paused. No frame-rate guarantee is implied by these tiers.

## Verification

`npm test` and `npm run build` passed. Numerical checks cover conserved mean phase with heterogeneous barriers, deterministic evolution, balanced disturbance, nutrient/mineral balance, bounded state, suppressed motion under mineral and retained history through dissolution. Independent review also ran 2,000 high-control steps on a 64² grid without non-finite state.

Browser validation uses Playwright because the Browser plugin is unavailable in this session. Chromium runs with **SwiftShader software WebGL**, not a physical GPU. Checked shader compilation/linking and rendered output, evolving stored state, pause, palette selection, PNG download, mutation, quality reset, touch disturbance, all 180 shared palettes, mobile layout and forced Canvas fallback. Viewports: 1440×1080 and 390×844. Screenshots were visually inspected for specimen framing, color/relief, readable controls, desktop/sidebar layout and mobile stacking/overflow. No image reference was supplied; the requested material-art direction is the visual criterion.

The first software run was roughly 2 FPS desktop / 5 FPS mobile-sized; these are software-renderer observations, **not hardware benchmarks or a claim of smooth iPhone performance**. Physical iPhone Safari, real GPU timing, extended thermal load and device-specific export behavior remain untested. Fine tier is deliberately expensive. See the final handoff for any additional runtime checks after this document was written.

No deployment, hosting service or change to GitHub main is part of this experiment.
