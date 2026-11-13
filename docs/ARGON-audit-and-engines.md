# ARGON — the missing mathematics

> **Historical audit snapshot:** numerical inventory below was taken before the OTHERSPACE II update (57 presets / 180 palettes). Current Hyperbolica main has **67 curated presets and 194 palettes**. The ARGON experiments were reconciled onto the newer main without reverting those additions.

Source inspected at `eaf857d9631295c987a0ab338a447fb35c782cbc` (12 November 2026). This is a source audit and experimental design document. Proposed mechanisms below are proposals, not capabilities already implemented. The first selected experiment is **Spinodal Reliquary**; runtime and device validation belong in that experiment's own README.

## Diagnosis

Hyperbolica has a rich vocabulary of shapes, coordinate transformations, materials and compositions. Its most important missing layer is **material state whose evolution changes the rules that will govern its own future**. The opportunity is much larger than adding a seventeenth analytic field.

The current renderer predominantly answers `appearance = F(position, time, controls)`. A growing material requires something closer to `state(next) = evolve(state(now), metric, boundary conditions)` followed by `geometry, transport, optics = read(state)`. Time is then a history, not simply another coordinate. A scar must remain after the gesture that created it; a pore must change the route by which tomorrow's nutrient arrives; light concentration must be capable of growing the structure that redirects the next light ray.

The inventory matches the brief: imported exports contain **16 field families, 12 mesh families and 57 presets**; the local JSON contains **180 palettes**. These counts were evaluated from the actual files. The repository uses native JavaScript, Three.js 0.160.1, GLSL and Vite. The existing artwork and provenance sources should remain intact.

### What the code actually does

| Capability | Present and substantive | Approximation or limit | Missing consequential step |
|---|---|---|---|
| Persistent time and history | Ping-pong render targets and actual previous-frame sampling, with curl advection and directional pointer injection. See `src/main.js:712–724`, `1151–1163`; `src/shaders/curl-feedback.frag:68–105`. | The stored state is rendered RGB. Decay, chromatic remapping and compositing are artistic optical memory. | Persistent species, orientation, strain, phase, solid mass, damage or evolving mesh connectivity. |
| Morphogenesis | Astral evaluates multiscale wavelet triads with activator/inhibitor-like terms; Pack II evaluates spiral and branch-like fields. | Astral recomputes its triads from coordinates/time (`astral-field.frag:188–249`). Pack II sums prescribed moving spiral sources and folded ridges (`hyperweave-pack2.frag:343–403`). Neither integrates an excitable or reaction–diffusion PDE. | Local chemical kinetics, diffusion, depletion, nucleation, competition and growth arrest with retained state. |
| Geometry | Real parametric vertices are displaced; finite differences supply surface normals (`manifold.vert:111–130`). The cathedral uses distance-estimator raymarching and numerical normals (`cathedral.frag:160–166`). | Mesh indexing is fixed (`main.js:867–887`); a fragment discard creates visible openings (`manifold.frag:18–21`). This is useful rendering, but does not perform mesh surgery. | Dynamic surface extraction, splitting/joining of material regions, adaptive remeshing and boundary-aware fiber routing. |
| Differential/non-Euclidean geometry | Clifford projection, immersed surfaces, Möbius maps, hyperbolic distance, mirror/inversion groups and geodesic-related coordinates are genuinely present. OTHERSPACE explicitly computes Möbius maps and hyperbolic distance (`otherspace-atlas.frag:12–24`). | Most systems use prescribed coordinate constructions; there is no evolving intrinsic metric, connection or material-space solver. Surface parametrization is not automatically a globally valid conformal chart. | Laplace–Beltrami evolution; curvature-driven flux; parallel transport and holonomy; state attached to a deforming surface rather than screen coordinates. |
| Nematic order | Cathedral has recognizable half-angle defect and crossed-polarizer extinction constructions (`cathedral.frag:169–205`). | Defect angles are prescribed `atan`/sine fields. The variable called stress on the mesh is a sum of harmonic/gyroid/displacement magnitudes (`manifold.vert:113`), not a stress tensor. | Q-tensor relaxation/advection, spontaneous defect creation/annihilation, elasticity, anchoring and stress-coupled shape evolution. |
| Optics | Fresnel-like grazing response, anisotropic velvet, spectral channel offsets, translucent opal shading; Pack II uses a ray-map determinant inspired caustic estimator (`hyperweave-pack2.frag:208–245`). | The opal shader explicitly acknowledges its approximation (`manifold.frag:49–60`). There is no conserved ray/beam energy moving through growing geometry, calibrated dispersion or polarization transport through successive layers. | Geometry-dependent ray redistribution, wavelength/path-length dependent transmission, Jones/Mueller transport and light-driven morphogenesis. |
| Coupling | Cross-morphs can mix height, phase, ink and microdetail **before** normals and lighting (`hyperweave-pack2.frag:409–422`). Geometry-derived signals influence shading; gestures enter optical history. | It would be inaccurate to call all existing combinations simple color blending. However, most interactions still terminate in appearance within that frame. | Feedback from generated structure into transport, growth, mechanics or topology in subsequent steps. |
| Swarms | Actual instanced sprites and mathematically structured trajectories are present. | Astral's Thomas-inspired motion is an analytic trigonometric trajectory (`astral-swarm.vert:37–48`), not persistent ODE integration of interacting agents. | Agents that sense, deposit, compete and modify their environment, with their own retained positions/velocities. |

“Missing” here means no substantial implementation found in the inspected active source, rather than proof that an idea has never appeared in an artist's earlier work. Legacy HTML is valuable provenance; it does not establish active runtime state in the integrated renderer.

## Ten engines, ranked

Scores are editorial estimates from 1 to 5, not measured results. **O** = originality relative to this repository; **V** = visual potential; **M** = mathematical depth; **F** = feasibility for a useful browser prototype. Implementation order favors an early working causal system and mobile headroom, so rank is not a simple sum. These are ten different structural designs, not ten palettes of the same algorithm.

| Rank | Engine / experimental design | O | V | M | F | Structural distinction |
|---:|---|---:|---:|---:|---:|---|
| 1 | **Spinodal Reliquary** — mineral that arrests its own phase separation | 4 | 5 | 5 | 5 | Conserved coarsening, perforation/reconnection, mineral feedback and deposition memory. |
| 2 | **Disclination Silk** — defects that weave their own liquid-crystal skeleton | 5 | 5 | 5 | 3 | Mobile nematic defects grow oriented fibers; fiber stress acts back on nematic order. |
| 3 | **Liesegang Lung** — self-banding, selectively permeable precipitation organ | 4 | 5 | 4 | 5 | Real reaction fronts and nucleation thresholds produce and redirect future bands. |
| 4 | **Holonomy Jacquard** — a textile with incompatible parallel transport | 5 | 5 | 5 | 3 | A connection on a growing curved surface determines actual fiber paths and accumulated twist. |
| 5 | **Martensite Psalm** — a soft crystal that changes metric in discrete variants | 5 | 5 | 5 | 3 | Elastic compatibility produces branching twin laminates rather than decorative stripes. |
| 6 | **Cut-Locus Orchard** — a mineral circulatory system born from competing distances | 5 | 5 | 4 | 4 | Eikonal arrival fronts, moving cut loci and transport reinforcement build actual routes. |
| 7 | **Fracture Choir** — a transparent membrane that sings itself into cracks | 4 | 5 | 5 | 3 | Elastic modes drive damage, which changes the modes and redistributes fracture stress. |
| 8 | **Hyperbolic Lightning Nursery** — growth competing for harmonic measure | 4 | 5 | 5 | 4 | Dielectric breakdown on a hyperbolic metric, with depletion and dielectric screening. |
| 9 | **Nonreciprocal Tideglass** — two materials that refuse thermodynamic reciprocity | 5 | 5 | 5 | 3 | Asymmetric conserved couplings cause chasing domains and traveling phase boundaries. |
| 10 | **Catastrophe Aquarium** — a glass organism cultivated by its own caustics | 5 | 5 | 5 | 2 | Fold/cusp caustic energy causes photoresponsive growth, closing a geometry–light loop. |

The strongest four for this series are ranks 1–4. Rank 1 was implemented in the first installment. After the artist's **NEXT**, rank 2 is now implemented separately at `experiments/disclination-silk/`; its README distinguishes the reduced spring-chain model from the broader proposal below. Each subsequent substantial experiment begins after **NEXT**, as requested.

### 1. Spinodal Reliquary — selected first

**Mathematics.** Cahn–Hilliard conserved phase separation with a double-well chemical potential, nutrient diffusion and interfacial mineral deposition. A representative mechanism is

```text
μ = c³ − c − κ Δc
∂t c = div(M(s) grad μ)
∂t n = div(D(s) grad n) + reservoir − consumption
∂t s = deposition(n, interface(c), s) − dissolution(s)
```

Here `c` labels two separating phases, `n` is nutrient and `s` is deposited mineral. Mineral suppresses mobility `M`, so the material eventually traps the very phase boundaries that created it. The flux form matters: multiplying a Laplacian by a spatially varying mobility would lose the intended conservative exchange. Details, numerical step sizes and any regularization belong to the implementation README; this is not a calibrated silica precipitation model.

**Computation and visible consequence.** A finite-difference field evolves in ping-pong buffers or equivalent CPU arrays. Initially small perturbations separate into labyrinths, narrow necks drain, islands merge and pores reconnect. Mineral progressively freezes some of those events. Accumulated deposition supplies rendered thickness, surface relief and interference phase. The first practical representation is a **2D material system with a 2.5D relief/implicit material rendering**, not a claim of fully volumetric remeshing.

**Appearance.** Wet opaline ligaments and dark perforations: a lace organ whose unmineralized edges remain fluid while older membranes become nacre. Thickened seams carry separated prismatic bands; quiet, nutrient-starved regions preserve earlier shapes.

**Meaningful controls.** Composition changes droplet versus interconnected regimes; interface penalty changes characteristic scale; nutrient supply changes where/when mineralization proceeds; deposition rate and mobility arrest change what gets preserved; dissolution reopens motion. Pointer nutrient injection or local dissolution should leave a persistent scar. Independent speed changes the number of stable integration steps, never the stable timestep itself.

**Why different.** The existing gyroids and Turing-like triads prescribe complexity in their formulas. Here the pattern is produced, altered and arrested by its own evolving state. A neck that pinches off is a state event, not a periodically scrolling mask.

### 2. Disclination Silk — selected next

**Mathematics.** Use a 2D traceless Q-tensor, `Q=[[q1,q2],[q2,-q1]]`, with a Landau–de Gennes-like bulk potential, orientational elasticity, flow alignment and substrate friction. A reduced overdamped active-stress model is appropriate initially; it should be labeled a reduced active-nematic model rather than a complete Beris–Edwards fluid solver. Half-charge defects emerge where order vanishes. Persistent fibers grow along the leading eigenvector of Q, with local growth rate weighted by defect proximity and nutrient.

**Mechanism.** Evolve Q and a coarse velocity field; advect/integrate short fiber tips; deposit oriented fiber density. A small spring network or anisotropic sheet stores rest-length changes from deposition. Its computed stress reorients Q and changes crossed-polarized retardance. Defects therefore drag real tracks, collide, annihilate and leave structural fossils that redirect later defects.

**Appearance.** Comet-shaped disclinations pull wet fluorescent silk through black liquid crystal. Polarizer-dark fans sweep across fibers whose deposited twist never quite relaxes. A dense patch becomes a glistening stressed knot, not a stationary vortex drawing.

**Controls and motion.** Activity sign/magnitude, orientational elasticity, anchoring strength, growth persistence, nutrient and fiber rigidity. Activity can switch from quiet alignment to spontaneous defect turbulence. Pause retains Q and every fiber; reseed changes initial defects, not merely shading.

**Difference.** Cathedral's prescribed defect angle remains valuable as an aesthetic source; this engine gives defects autonomous trajectories, structural consequences and mechanical feedback.

### 3. Liesegang Lung — selected third

**Mathematics.** Two diffusing reagents produce a soluble intermediate; precipitation activates above a nucleation threshold and continues above a lower growth threshold. This hysteresis plus depletion can generate Liesegang-like separated bands. It is a reduced threshold precipitation model, not a molecular description of a particular reagent pair.

**Mechanism.** Evolve reagent concentrations `a,b`, intermediate `p`, precipitate `s` and optionally layer thickness. Feed one reagent at local pores and the other from a reservoir. Precipitate lowers permeability. A front creates a membrane; that membrane bends the next front; branches compete for supply. Permit dissolution under a chosen reagent imbalance so pores can reopen. Extract membrane contours and extrude them into thin wet sheets, or render a shell-density volume at a bounded resolution.

**Appearance.** Nested discontinuous glass gills, banded agate lungs and folded precipitation curtains. Tiny openings act as chemical mouths, spawning daughter chambers. Deposited thickness causes opal color separation and growth-age bands.

**Controls and motion.** Nucleation/growth threshold separation, reagent ratio, diffusion ratio, feed geometry, permeability loss and dissolution. Bands appear only after enough intermediate accumulates, then cease when supply is exhausted. Changing feed location produces a causal new organ rather than moving the old one.

**Difference.** No prescribed spiral phase or radial band formula. Bands and their spacing emerge from transport, threshold memory and depletion.

### 4. Holonomy Jacquard — selected fourth

**Mathematics.** Parallel transport on a triangulated surface, discrete Levi-Civita connection and curvature-induced holonomy, coupled to differential growth of a ribbon/spring surface. Around a closed loop, a transported tangent generally returns rotated by integrated Gaussian curvature. That mismatch becomes a structural source of textile frustration.

**Mechanism.** Begin with a modest adaptive mesh or fixed mesh plus controlled local refinement. Fiber tips carry tangent directions; crossing an edge transports the direction between face frames. Trace actual paths and retain over/under crossing decisions. Accumulated fiber stress changes edge rest lengths; a damped relaxation step deforms the surface; its changed connection bends future fibers. Remeshing must transfer fiber coordinates and material fields rather than reset them. A first prototype can avoid arbitrary topology edits while still evolving geometry and paths.

**Appearance.** Glass thread on inflated saddles, densely pleated silk near curvature sources, impossible rosettes at twist reservoirs. Defect seams occur because orientations cannot be made globally consistent, giving mathematically earned ornament.

**Controls and motion.** Growth tensor anisotropy, curvature seed, fiber insertion rate, bending stiffness, crossing clearance and anchoring. Fibers accumulate permanent twist while the surface buckles and redistributes it.

**Difference.** Existing Jacquard and geodesic-like fields render convincing weaving motifs. This one constructs and retains fibers on a surface whose intrinsic geometry changes because those fibers grew.

### 5. Martensite Psalm

**Mathematics.** Transformation variants with different preferred strain tensors, multiwell elastic energy and rank-one compatibility. For a coherent laminate interface, the deformation-gradient jump has form `F1−F2 = a⊗n`; arbitrary neighboring variants do not fit without elastic cost. A reduced 2D phase-field elasticity model is enough to expose the geometry.

**Mechanism.** Store variant fractions and displacement; alternate elastic relaxation with phase updates driven by elastic plus interfacial energy. Transformation changes the stress-free metric. Stress selects the next variant and sharpens or branches twins. Use a coarse multigrid/Jacobi elastic solve and fine variant texture, keeping solver residual visible in diagnostics rather than pretending full convergence.

**Appearance.** Bismuth-like membranes split into nested mirrored herringbone plates. Wet crystalline fans form beside soft untransformed material; fine twin seams display stress-retardation colors. The microstructure looks woven even though it is born from compatibility.

**Controls and animation.** Transformation strain, temperature-like well bias, loading direction, interface penalty and elastic contrast. Loading sweeps transform domains with hysteresis; unloading leaves variants and residual stress.

**Difference.** A quasicrystal/punch-card pattern does not enforce mechanical compatibility. Here stripes and branching exist because the deformations have to fit together.

### 6. Cut-Locus Orchard

**Mathematics.** Weighted eikonal fronts, geodesic Voronoi competition, cut loci and reinforcement of a transport network. The cut locus is the set where multiple shortest routes meet or shortest paths lose uniqueness; it is more structurally interesting than drawing another Voronoi boundary.

**Mechanism.** Solve arrival time from nutrient ports on a material-dependent metric with fast sweeping or jump flooding plus refinement. Route flux along descending arrival-time gradients. Reinforce heavily used edges and dissolve unused ones. The resulting network changes travel cost and therefore moves the next cut locus. Impose source/sink budgets and regularization to avoid every path collapsing into one trivial trunk. Track graph edges and physical radius, not only a distance texture.

**Appearance.** Transparent vascular roots wrap unreachable shadow chambers; fluorescent supply vessels thicken into opal buttresses. Rival trees graft where their transport advantage shifts. Fine colored filaments reveal which source currently feeds each region.

**Controls and animation.** Source/sink placement, metric anisotropy, congestion penalty, reinforcement exponent, pruning and graft threshold. Moving a source reroutes actual flow and slowly remodels the graph.

**Difference.** OTHERSPACE already has hyperbolic Voronoi distance. The new work is distance-to-flux-to-growth-to-distance feedback, with retained network topology.

### 7. Fracture Choir

**Mathematics.** Elastic wave dynamics plus a phase-field damage variable with an irreversible history field. A reduced Griffith-inspired energy trades released elastic strain energy against crack-surface energy. A few driven or evolving elastic modes can supply patterned loading without claiming a full acoustic simulation.

**Mechanism.** Integrate a damped membrane displacement and stored strain-energy history. Damage reduces local stiffness; high energy grows damage; damage redistributes the next wave and stress. Let a slower mineral field seal selected cracks, changing stiffness and optical thickness. Track damaged connectivity in the scalar field; only call it mesh fracture if triangles are actually separated.

**Appearance.** A dark translucent cymatic window develops luminous branching cracks, then repairs them with fluorescent kintsugi. Perforations grow into organ pipes; old sealed scars scatter the next vibration.

**Controls and animation.** Drive frequency, fracture toughness, tension, anisotropy, damping and healing rate. Resonance can abruptly shift after a ligament fails, producing a visible event chain rather than a repeating Chladni pattern.

**Difference.** The existing Chladni formulas supply designed nodal geometry. Here material failure changes the boundary-value problem that determines subsequent oscillation.

### 8. Hyperbolic Lightning Nursery

**Mathematics.** Dielectric-breakdown growth weighted by harmonic measure, using a Poincaré metric and Laplace–Beltrami operator. In two dimensions the scalar Laplace–Beltrami operator of a conformal metric has a simple metric factor; constant isotropic harmonic functions alone will not automatically create a new growth law. Metric-weighted flux, physical cell area, attachment probabilities and boundary placement must be handled consistently to make curvature consequential.

**Mechanism.** Solve potential outside the retained conducting network; choose frontier growth from regularized electric flux raised to a tunable exponent; update dielectric occupancy and resolve potential. Add anisotropic attachment kinetics and nutrient depletion. Solve on a bounded disk away from the ideal boundary; avoid interpreting pixel density near the rim as physical density.

**Appearance.** Lightning that becomes a delicate living mineral: sparse glass antlers, crowded geodesic forks and luminous tips that screen one another. Branches shelter cavities where competitors cannot obtain flux.

**Controls and animation.** Curvature scale, harmonic-measure exponent, attachment anisotropy, electrode geometry, screening and feed. Tips split and branches arrest due to competition.

**Difference.** Hyperbolic coordinate warps and procedural Lichtenberg ridges are already present. Here the growing branch changes the field that chooses the next branch.

### 9. Nonreciprocal Tideglass

**Mathematics.** Two conserved phase fields with asymmetric cross-coupling, for example `μa=a³−a−κa Δa+αb` and `μb=b³−b−κb Δb+βa` with `α≠β`. Suitable signs and parameter regimes break reciprocal gradient-flow structure; a single shared free energy need not exist. This does not guarantee traveling patterns for every choice, so the prototype must establish a bounded useful regime experimentally.

**Mechanism.** Use conservative fluxes for both fields; identify interfaces and deposit mineral preferentially where a chasing boundary passes an older mineral ridge. Slow mineralization changes mobility asymmetrically, recording the pursuit. A fixed-step solver and bounded parameter controls matter because nonlinear instabilities are part of the mechanism, not an excuse for exploding values.

**Appearance.** Two wet glass phases chase and consume one another, folding fluorescent tide lines into traveling pearl cells. Arrested ridges form time-recording strata while unmineralized regions continue moving.

**Controls and animation.** Nonreciprocity, phase composition, mobility ratio, interface length scale and mineral-memory rate. Domains can drift, orbit, split or arrest without any externally scrolled coordinates.

**Difference.** This extends the first prototype's conserved state into actively maintained motion, rather than adding a new analytic wave warp. It is a later extension because two-field nonreciprocal stability must be characterized separately.

### 10. Catastrophe Aquarium

**Mathematics.** Fold and cusp singularities of an optical ray map, regularized finite-footprint energy deposition and photoresponsive growth. Catastrophe theory classifies robust singularities; it does not by itself calculate illumination or imply that every bright curve is a physical caustic.

**Mechanism.** Trace a bounded set of paraxial rays through a growing refractive relief, splat their finite energy into a receiving plane, and evolve a photosensitive thickness field from that illumination with saturation and lateral diffusion. Thickness changes optical slopes and the next ray mapping. Use several wavelength samples only after the energy loop is stable. A conservation diagnostic must distinguish a brighter focus from accidental energy creation by splatting.

**Appearance.** Glass organisms cultivate cusp-shaped mouths. Spectral caustic filaments sculpt new lenses which move the focus, creating a slow self-steering garden of opaline hooks and liquid needles.

**Controls and animation.** Refractive contrast, light angle, photo-growth sign, saturation, smoothing and growth latency. An illumination change triggers structural migration that continues after the light is fixed.

**Difference.** Pack II already evaluates an artistic caustic determinant. The new mechanism transports energy and lets its distribution modify the geometry that focuses it. This has the highest optical cost and is deliberately last in mobile implementation order.

## The bridges: a shared causal grammar

These should be modules with explicit state inputs/outputs, not a universal knob that multiplies textures. Units may be dimensionless, but conventions must be documented. Keep simulation timestep, render timestep and palette indexing separate.

| Bridge | Producer → consumer → feedback | Visible evidence | Falsifiable check |
|---|---|---|---|
| **Chemical foundry** | Species/phase interfaces → deposited solid and thickness → lower mobility/permeability → altered future interfaces. Thickness also drives relief and optical path. | A nutrient pulse freezes a neck that otherwise would disappear; a dissolved hole reroutes later growth. | Same seed with mineral feedback disabled must evolve differently in stored `c,n,s`, even under identical palettes. Conservative phase exchange should approximately preserve total phase. |
| **Defect loom** | Q-tensor → persistent fiber paths/rest lengths → computed elastic stress → director alignment and retardance. | A passing defect leaves a fiber scar; the scar deflects a later defect and retains an extinction signature. | Freeze stress feedback: the next defect trajectory should change. Rotate the polarizer: appearance changes while underlying material state stays fixed. |
| **Intrinsic shuttle** | Deformed metric/connection → transported fiber direction → anisotropic growth tensor → deformed metric. | Fibers gather twist around curvature and physically buckle the support. | On a flat patch, transport around a small loop should have nearly zero holonomy; on a curved patch it should agree with integrated discrete curvature within discretization error. |
| **Photon gardener** | Surface slopes/index → redistributed finite optical energy → growth/dissolution → changed slopes/index. | A focused cusp grows a lens that moves its own focus. | With photoresponse disabled, illumination can change without geometry changing; with it enabled the stored geometry must diverge. Track incident versus accumulated energy. |
| **Fracture resonator** | Elastic displacement → strain-energy history → damage/healing → stiffness and future eigenmodes. | A crack shifts a resonance; sealing one ligament makes a different region fail next. | Holding the damage field fixed should remove the structural frequency shift. Damage must not decrease unless explicit healing is enabled. |

A small integration contract can expose `phase`, `nutrient`, `solid`, `thickness`, `directorQ`, `metric`, `stress` and `damage` textures/arrays, plus validity masks and sampling transforms. Every module should declare which it reads and writes. The main renderer need not know the chemical equations; it should receive a stable material-state interface. Avoid forcing every engine to allocate all fields.

**Material coordinates are the other crucial link.** A surface sampler needs a mapping from world position to retained material coordinates, not merely screen UV. Otherwise a camera move appears to drag chemistry through the object. Version and transfer state when quality or remeshing changes the discretization. Do not silently reseed on resize.

## Browser implementation boundaries

- Keep the experiments in their own labeled directory and entry routes on a feature branch. Do not replace any engine, preset or original source.
- Start with bounded 2D state and relief rendering. Move to volumetric extraction only when a 3D state mechanism justifies the memory cost. Do not describe fragment holes or relief as arbitrary mesh topology surgery.
- Use nearest/exact sampling for PDE stencils and interpolate only for display. Test floating render-target support, framebuffer completeness and shader compile/link status at runtime. A CPU/Canvas or lower-grid fallback should retain meaningful evolution when GPU features fail.
- Quality tiers should bound both simulation grid and display pixel budget. Speed changes stable substep count, not the equation's stable step size. Background tabs and slow frames must not trigger unbounded catch-up.
- Source colors and the existing 180-palette library should be rendering choices over identical state. No chemical parameter should be hidden in a palette selection.
- Include pause, independent speed, structural mutation/reseed, quality, palette and PNG export. Mutate should identify whether it changes only parameters or resets history. Snapshot should capture a deliberately rendered current frame.
- Validate the causal state, not just screenshots: conservation/finite-value diagnostics, controlled perturbations and feedback ablations. Build success and source tests do **not** establish GPU compilation. Headless desktop software WebGL, real desktop GPU and physical iPhone Safari are different validation levels and must be reported separately.

The organizing principle is simple: **make each visual structure an instrument of the next mathematical event**. Pores should transport. Defects should weave. Stress should bend. Light should select growth. The ornament then becomes evidence of an evolving material.
