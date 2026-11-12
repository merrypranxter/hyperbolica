# HYPERBOLICA
**A playable mathematical biomineral / photoelastic / quasicrystal / manifold / particle-swarm art laboratory.**

Built from the user's original **Hyperbolic Photoelastic Biomineralization** shader and inspired by the **Hyper-Loom** three-layer interaction model. Independent project; no Netlify deploy is triggered by this repository commit.

## Play locally
For development: `npm install && npm run dev`, then open the printed local address. For static hosting: `npm run build` and serve `dist/`. The app runs entirely in the browser; no paid generation API is required.

## Art engines
- A family of distinct GPU procedural biomineral and photoelastic background fields
- Parametric 3D manifold geometries with live displacement
- GPU instanced orbit glyphs, plus solo/mixed render layers
- Damped pointer/touch drag: camera orbit, interactive field warp and mathematical phase torque
- **168 source-faithful MATHEMAGICAL! palettes** stored locally
- Seeded mutations, selective mutations, variation gallery, adjustable palettes, PNG captures
- Mobile quality controls, touch-friendly pinned/tabbed HUD, context-loss status

## Source and provenance
- `legacy/hyperbolic-photoelastic-original.html` is the original shader/artifact supplied by the artist, retained unmodified as reference.
- `data/mathemagical-palettes.json` is copied from `merrypranxter/flockingartapp/data/mathemagical-palettes.json` (103 foundational palettes), plus 28 from `impossibleloom/src/palettes.js` and 31 from `austereograms_art_app/src/palette-bank.js` (162 total) plus five preserved Astral Loom ink banks (167 total) for portable, independent use.
- The Three.js/GLSL source is an original implementation for Hyperbolica, not a claim that the Hyper-Loom pasted demo is already a working integrated module.

## Export notes
PNG saves the current rendered frame. Browser video recording capabilities differ, especially on iOS; the app tests MediaRecorder formats at runtime. Deterministic high-resolution frame-sequence and verified lossless GIF/MP4 export are separate planned improvements.


## November 12 expansion — 4D Nematic Cathedral + Optical Memory

**The artist's third source, `legacy/hyperloom-nematic-cathedral-original.html`, is preserved as a standalone source reference.** Its distinctive geometry and processing systems are now integrated into the actual application; it is not just a link or a color filter.

- **4D Cathedral** mode: real signed-distance raymarching of 4D folding transformations, Apollonian-Mandelbox geometry and a navigable corridor, with liquid-crystal director/disclination shading, Schlieren extinction brushes, birefringent colors, Chladni lattice and a volumetric light accumulator.
- **Biomineral Field** mode: all 16 original mathematically distinct shader families still available.
- **Hybrid** mode: real 4D cathedral beneath a separately moving biomineral field with adjustable blend, and both can be combined with the sculpted 3D objects and GPU-instanced swarm.
- **Flow / Print**: a framebuffer **ping-pong** optical-memory simulation that advects the prior frame with a divergence-free curl vector derived from a scalar potential (not mere alpha trails), followed by a four-angle **15° cyan, 75° magenta, 0° yellow/lime and 45° violet** spot-screen rosette shader. Applied to any engine.
- **Palette-safe rendering**: cathedral shader samples the currently selected MATHEMAGICAL! palette; printing plates can use four colors from that same palette, or the source's fixed neon inks. Chroma lock is opt-in, allowing airy opal/white palettes rather than destroying them.
- **More starting states**: 32 curated designs, including eight Cathedral/Feedback/Hybrid additions; structural mutations can spawn these engine types.
- **Source-informed controls**: 4D rotation, inversion, Chladni, Schlieren, flight speed (including reverse), ray depth (fast/medium/full), feedback persistence, curl strength, dot frequency, chromatic dispersion, plate ink mode, anti-whiteout protection, clear trails and reset view.
- **Mobile safety**: raymarch depth can drop to 22 steps, while 3 full-frame postprocess targets are bounded at about 780k pixels per target on touch/mobile displays and 2M on desktop. Temporal GPU buffers are allocated only when postprocessing is enabled. No Netlify action has been triggered.

### Play and testing status

Run `npm install && npm run dev` in the repo, then open the local address. `npm run build` produces a static website in `dist/`. **Source and static checks passed** (JS parse, UI binding references, shader structural checks, preset palette IDs); a real browser GPU compilation and iPhone Safari performance check are **still required**. Heavy cathedral mode should be tested at low Ray Depth first. A build in GitHub is not a live website and does not consume Netlify credits by itself.

## Opal Cathedral Memory Garden — interactive glass fusion

The default startup design is now **32 · OPAL CATHEDRAL MEMORY GARDEN**. It combines a moving 4D raymarched corridor, a subtle 3D gyroid optical field, a **two-sided translucent silica cage** with thin-film pearlescent lighting, and a GPU curl-feedback simulation. It adds three related distinct glass/cathedral presets (33–35); the original 0–31 presets are unchanged.

New Opal controls in **Optics**: shell opacity, pearlescent transmission, optical thickness, and Fresnel edge glow. **Flow / Print** adds gesture-driven curl impulse strength. Dragging the art creates directional flow injection in the history buffer around the fingertip, while ordinary camera and field gestures still work. The hero opens in orbital drag mode, with Sculpt mode available in **Motion**.

Press **ENTER OPAL CATHEDRAL MEMORY GARDEN** on the Designs tab to return to this scene from any other artwork. Its initial palette is the existing `itsamoire/opal`, but all 168 local palette IDs and per-stop editing remain available. **None of these modes uses a paid API or launches a Netlify deployment.**

The translucent material is a physically inspired alpha/Fresnel/thin-film optical approximation, **not real glass transmission or ray-traced refraction**. GPU shader compilation, particularly WebGL Safari performance, must still be validated on a live device; JavaScript syntax and static code/controls tests alone do not certify it.


## November 12 — Astral Loom four-engine expansion alongside Opal Memory Garden

Alongside the pre-existing Opal Cathedral Memory Garden on main, the artist's complete 2,019-line `legacy/astral-loom-4-engine-original.html` is retained unchanged as provenance. The corresponding integrated renderer is `src/shaders/astral-field.frag`, with independent `src/shaders/astral-swarm.vert` and `src/shaders/astral-swarm.frag`.

- **Four distinct animated mathematical shader families**, fully selectable and continuously cross-morphable: complex-sheet / Calabi–Yau-inspired folds, Turing–Physarum-style wavelet morphology, truncated alternating eta/zeta-inspired cymatic and crop-circle harmonic geometry, and Hopf/ferrofoam-inspired flux filaments. These are **procedural visual approximations**, not a true 6D geometry solver, actual reaction-diffusion PDE, or physical MHD simulation.
- **Three new render modes**: Astral solo, Astral over Biomineral, Astral over the 4D flying Cathedral. Existing independent 3D geometry and glyph swarm remain available.
- **Separate GPU point swarm**, up to 12,000 source-derived phyllotaxis/Thomas trajectories, with independent toggle/strength/count. Coexists with the existing 14k-capable 3D Hopf swarm.
- **Five additional original Astral Loom color banks**, transferred from its original five RGB stop lists. MATHEMAGICAL palette count is now **168**, and the original palette dropdown and color-stop editor still control every engine and swarm.
- **Signature startup artwork preserved from main**: Preset 32, *Opal Cathedral Memory Garden*, retains its 4D cathedral, pearlescent shell transmission controls, and directional gesture-driven curl advection. Astral is an additional choice and can also be blended with the cathedral through the new render modes.
- **Other new starter designs**: 8 Astral source-inspired modes and *Opal Ferrofoam Cathedral*, bringing the shared bank to **57 curated presets**, including the later Pack II and Texture Lab additions.
- **Mobile controls**: lower initial ray depth and optional cheaper Astral normal evaluation; capped framebuffer resolution, independently adjustable sprite counts and quality.
- **Source safety**: original artist sources are preserved as HTML under `legacy/`. Running `npm test` checks the palette library, all preset IDs, UI element links, original references and basic shader structure. `npm run build` compiles the Vite app; a real browser GPU and mobile Safari trial is still necessary before declaring the render pipeline production-tested.

No Netlify deployment was initiated.

## HyperWeave Pack II + three new source-faithful Texture Lab worlds

**Duplicate detection.** The two repeated `hyperbolic_photoelastic_biomineralization` HTML files and repeated `astral_loom_4_engine_psychedelic_synthesis_suite` HTML file were already represented in `legacy/`. The standalone `astral_loom_fragShader.frag` contains the math already integrated into `src/shaders/astral-field.frag`. These were **not imported as duplicate engines or presets**.

**Five genuinely new source files were used:**
- `src/engines/HyperWeavePack2.js` — the original runnable JS cartridge/6 preset bank for Engines 05–08, actively imported by `src/presets.js`.
- `legacy/hyperweave-pack2-engines-original.frag` — unaltered Pack II shader reference; `src/shaders/hyperweave-pack2.frag` is its palette-integrated live counterpart.
- `legacy/glitch-voronoi-maximalist-original.html`, `legacy/iridescent-alien-velvet-original.html`, `legacy/maximalist-texture-generator-original.html` — complete HTML references with their live counterparts `src/shaders/texture-{voronoi,velvet,maximalist}.frag`.

**Pack II** adds four true distinct shader functions, continuously cross-morphable through a dedicated HYPERWEAVE II control tab: E5 Poincaré/Girih inversions, E6 catacaustic Neovius gem faceting, E7 Jacquard punch-card brocade / Memphis geometry, E8 Belousov–Zhabotinsky-like spiral waves / branching Lichtenberg ridges. The source cartridge's six-curated DNA configurations now load directly with their original depth/tension/frequency/phase and engraving parameters.

**Texture Lab** adds three separate algorithms rather than generic filters: moving Voronoi cell boundaries with interference / CRT sync tears, tangent-based anisotropic alien velvet microfuzz with crevice glow, and double/third-level recursive fBm domain warping. The original shader functions remain distinct and animated.

Both tabs support solo, blend-over-original-biomineral-field, and blend-over-flying-cathedral configurations. All new graphics sample the shared palette texture and respect selected edited color stops; source colors remain available via texture-palette-mix control. The original Pack II's *six-stop spectral ring* becomes the **168th palette**. There are **57 curated designs**, including six original-cartridge Pack II states and six purpose-built texture starting points. Original Opal Cathedral Memory Garden remains the startup design.

**Compatibility:** Pack II and each Texture Lab shader are lazy-compiled on first selection; if a device cannot compile one, the base Opal/Cathedral/Astral app stays available. On older iPhones, lower Pack II normal quality and texture fractal octaves before increasing detail. All engines are procedural optics-inspired approximations, not physical caustic ray-tracers, actual hyperbolic 3D manifolds, PDE chemical simulations or fabricated scientific claims. Static source/JS/control checks have passed; real browser WebGL validation and exports still need a device test.

No Netlify deployment was performed.
