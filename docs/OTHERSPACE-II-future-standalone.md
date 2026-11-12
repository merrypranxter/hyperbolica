# OTHERSPACE II — Hyperbolic Acid Atlas: preserve as a separate future lab

**Status: source preserved; standalone redesign deferred.** Claude's original, self-contained WebGL 1 HTML is kept unchanged at `legacy/otherspace-ii-hyperbolic-acid-atlas-original.html`. The user's second upload is byte-identical to the first; do not store duplicates.

**Intent:** keep two independent, distinctive flavors of hyperbolic art: OTHERSPACE I is restrained and elegant, OTHERSPACE II is fluorescent acid/weirdness. The integrated math is a useful optional component of Hyperbolica; don't lose the idea of a *standalone* application later, and do not deploy or merge projects unnecessarily.

## The ten independently coded engine families

1. **Modular Jellyfish** — PSL(2,Z) half-plane folding and Ford-circle/horocycle structures.
2. **Guilloché Ribbon** — Fermi-geodesic coordinates, interlaced banknote sine curves.
3. **Schottky Lightning** — geodesic mirror reflections, tilings and Cantor-limit-set inspired boundaries.
4. **Chainmail Orbifold** — (2,p,q) triangle folding and three hyperbolic ring families.
5. **Binary Brickwork** — Böröczky-style horocyclic binary tiling.
6. **Blaschke Bloom** — finite disk Blaschke products iterated and domain colored.
7. **Confocal Moiré** — hyperbolic ellipse and hyperbola families from pairs of true hyperbolic distances.
8. **Dipole Whirlpool** — loxodromic log-ratio coordinates of two poles and double spiral arm families.
9. **Geodesic Times Table** — boundary chord multiplication converted to disk geodesics.
10. **Apollonian Proper** — four inversion mirrors and an exact/source-claimed gasket construction; verify geometric exactness independently before asserting it as a formal mathematical result.

## Differences compared to OTHERSPACE I

Original I: Poincaré and Klein projections, ten gentler independent math families, twelve five-stop palettes and light finishing. Acid II: **four** projections (Poincaré, Klein, upper half-plane, infinite band), ten additional families, **fourteen** fluorescent five-stop palettes, and extra standalone controls for rainbow mixing, kaleidoscopic folding, prism channel separation, halftone, glitter and dark-neon locking. Both share a broadly similar HTML architecture, but their fields and source-presets are distinct. Preserve both unmodified originals.

Original II includes an animated gallery, color-stop editors, seed/mutate controls, FX randomizer, source shader inspection, JSON recipe import/export, local bookmarks, PNG preview/export and an optional spoken-interface button. Standalone production status is not verified on iPhone/WebGL Safari.

## How it was integrated into Hyperbolica

- Original standalone source: `legacy/otherspace-ii-hyperbolic-acid-atlas-original.html`.
- Extracted *unmodified source* mode/palette/default/range/check data: `src/otherspace-acid.js`.
- All ten original GLSL implementations (one shader switched by mode), adapted to Three.js derivative extensions and alpha output: `src/shaders/otherspace-acid.frag`.
- Acid tab: source-starter selector, blend/solo/off controls, all four coordinate models, primary and advanced sliders, dynamic source FX toggles, source palette restore, mathematically seeded mutations and source-style five-stop random acid palette.
- All fourteen original source palettes added to the shared global bank (**194 total**).
- All ten original starter recipes added to global curated presets **57–66**, as optional full-screen acid artwork; **67 curated designs total**.
- Source DNA, palette editor and viewport interactions are integrated. All existing field, cathedral, Astral, Pack II, original OTHERSPACE, texture, 3D, particle and feedback modes are preserved.
- Shader lazy-compiles when enabled; defaults disabled, including initial Opal Cathedral. Source-level JS/parser/static checks do not substitute for iPhone shader compile + framebuffer visual checks.

**Future standalone features**, only when user authorizes: separate refined art-driven interface and controls, quality-tiered exact loops, deterministic frame sequence and verified MP4/GIF export, source JSON compatibility and focused explorations of all 20 hyperbolic systems without importing the entire heavy Hyperbolica suite. No Netlify deployment by default.
