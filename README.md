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
- **162 source-faithful MATHEMAGICAL! palettes** stored locally
- Seeded mutations, selective mutations, variation gallery, adjustable palettes, PNG captures
- Mobile quality controls, touch-friendly pinned/tabbed HUD, context-loss status

## Source and provenance
- `legacy/hyperbolic-photoelastic-original.html` is the original shader/artifact supplied by the artist, retained unmodified as reference.
- `data/mathemagical-palettes.json` is copied from `merrypranxter/flockingartapp/data/mathemagical-palettes.json` (103 foundational palettes), plus 28 from `impossibleloom/src/palettes.js` and 31 from `austereograms_art_app/src/palette-bank.js` (162 total) for portable, independent use.
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
