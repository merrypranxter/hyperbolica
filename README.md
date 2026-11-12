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
