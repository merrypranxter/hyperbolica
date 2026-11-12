# OTHERSPACE — a future *separate* art experiment

**Status: intentionally deferred.** The complete original file is permanently preserved at `legacy/otherspace-hyperbolic-starter-atlas-original.html` as supplied by the artist. It is a self-contained, already interactive WebGL-1 HTML application, not a mockup; it includes ten authentic hyperbolic starters, all 12 original color schemes, Poincaré and Klein projection choices, dragging the Möbius center, original scene recipes and JSON import/export, gallery thumbnails, shader inspection, and up-to-4096px PNG capture. Do not replace it with a generic fractal demo.

The artist likes its **simplicity and loveliness** and explicitly wants to make *something just with these mathematical forms later*. Do not automatically merge this independent concept into another bloated multi-engine app or spin up a Netlify deployment. The integration in Hyperbolica is a **lightweight optional background/overlay**, not the dedicated project.

## Original 10 mathematical families

1. **Citrus Cathedral** — hyperbolic reflection/triangle tessellation + rosette ornamentation, enforcing 1/p + 1/q below 1/2.
2. **Porcelain Horocycles** — boundary-centered horocycle/Busemann-function contours.
3. **Oxide Geodesic Loom** — orthogonal equidistant geodesic-curve thread families with decorative crossing.
4. **Vermilion Nodal Etching** — log-map cosine nodal fields; Chladni-like, not eigenmodes solved on a hyperbolic drum.
5. **Candy Cell Windows** — genuine hyperbolic-distance Voronoi nearest-neighbor cell boundaries.
6. **Abyssal Gyroid Ribbons** — gyroid-inspired trigonometric 2D slices decorated in hyperbolic log coordinates, not volumetric raymarch geometry.
7. **Gilded Spiral Reliquary** — 2atanh radial spiral and angular engraving.
8. **Riso Phason Interference** — multiple interacting incommensurate-frequency cosine directions in log-map coordinates, not rigorous global quasiperiodicity proof.
9. **Night Coral Wavegarden** — six interacting hyperbolic-distance / Möbius-angle analytic spirals; not a reaction-diffusion solver.
10. **Copper Inversion Foam** — bounded circle inversions and orbit traps, artistically inspired by Apollonian systems.

## Standalone possibilities for *later* (do not implement without a new go-ahead)

- Keep the pared-down UI, plentiful negative space and precise elegant linework; no automatic neon/maximum contrast everywhere.
- Add additional genuinely distinct conformal and hyperbolic maps; source-faithful Poincaré/Klein navigation, geodesic nets, curvatures, and polyhedral reflection groups.
- Export true 1:1 and 9:16 frames/loops with reproducible seed and viewpoint. Preserve existing JSON recipes and gallery.
- Build a mobile-first tablet/iPhone UI with artwork pinned at top; advanced controls tucked away, color-stop editing and selectable source palettes.
- Explore crossbreeding two hyperbolic coordinate maps without losing analytic meaning; permit restrained, slow mathematical motion.
- If spinning off to a new GitHub repository, use a new standalone project, not a copy of the 57-design Hyperbolica menu; no Netlify deployment until requested.

## Hyperbolica optional adaptation

Source preserved untouched; extracted data in `src/otherspace-atlas.js` and shader in `src/shaders/otherspace-atlas.frag`. Source geometry equations are retained. Changes are limited to the Three.js material interface: shader uniform names preserved, built-in derivatives extension managed by Three, alpha transparency introduced for gentle blending, source five-stop colors sampled from the global editable 180-palette vault. An OTHERSPACE tab switches 10 source-authored mathematical recipes, projection and layer treatments, with opt-in blending or solo mode. Default off, lazy GPU compile to keep the older modes playable.
