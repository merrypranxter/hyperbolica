// Source-faithful data extracted verbatim from the artist's self-contained OTHERSPACE HTML.
// Keep the original HTML in legacy/ for the separate standalone art project.
export const OTHERSPACE_PALETTES=[
 ['MIDNIGHT CITRUS',['#081a36','#00a8a8','#deff6c','#ff8d38','#fff0c9']],
 ['PORCELAIN / COBALT',['#f0e7d5','#92b7bb','#163a8b','#08214a','#ffffff']],
 ['OXIDE TAPESTRY',['#24121d','#a33930','#df8f43','#f5d1a3','#348b86']],
 ['GRAPHITE / VERMILION',['#080d13','#283844','#a2b3b7','#f0e8d5','#f44834']],
 ['CANDIED STAINED GLASS',['#20113b','#ab42e8','#ff679b','#ffbd57','#6bdbba']],
 ['ABYSSAL OPAL',['#030e22','#1c4b75','#25cbb8','#c2f3e9','#b59acb']],
 ['GILDED INK',['#100d22','#463161','#a46b42','#f0c65b','#fff2c6']],
 ['RISOGRAPH MISREGISTER',['#f4e9cc','#ff694f','#134eb1','#ef46ae','#1dbb9d']],
 ['CORAL AFTER DARK',['#071a21','#175e55','#a5c95a','#ff7a61','#ffc0a1']],
 ['PEARL / COPPER',['#140f19','#603548','#c68066','#ecc9a4','#fff3de']],
 ['PHOSPHOR TERMINAL',['#020b0b','#073e33','#0d8e61','#a9ed95','#e7ffd6']],
 ['BLACK / BONE',['#030303','#252525','#71716b','#d5d3c4','#fffced']]
];
export const OTHERSPACE_MODES=[
 {name:'Citrus Cathedral',tag:'REFLECTION / POLYGON LACE',palette:0,note:'Actual hyperbolic triangle reflections with decorative rosettes inside each folded tile. p = polygon order; q = vertex order. Hyperbolic validity is enforced: 1/p + 1/q < 1/2.',params:{p:7,q:3,depth:36,density:5.1,shape:1.4,twist:.7,zoom:1.03,width:1,relief:.9,drift:.35,exposure:1.8},effects:{embossOn:true}},
 {name:'Porcelain Horocycles',tag:'BOUNDARY / PEARL CONTOURS',palette:1,note:'Contours of the Busemann function log((1−|z|²)/|z−ξ|²), where ξ is on the ideal boundary. Multiple horocycle families interfere; no physical pearl simulation.',params:{p:5,q:3,depth:32,density:4.4,shape:1.3,twist:1.2,zoom:1,width:.8,relief:.35,drift:.25,exposure:1.6},effects:{embossOn:false,haloOn:false,hardPalette:false}},
 {name:'Oxide Geodesic Loom',tag:'EQUIDISTANT / OVER–UNDER',palette:2,note:'Signed hyperbolic distances to two perpendicular diameters produce equidistant curve families. Over–under occlusion is a decorative weaving treatment.',params:{p:8,q:3,depth:32,density:4,shape:2,twist:2.4,zoom:1.04,width:1.4,relief:1.2,drift:.35,exposure:2.1},effects:{embossOn:true,hardPalette:true}},
 {name:'Vermilion Nodal Etching',tag:'LOG-MAP / CHLADNI-LIKE',palette:3,note:'Cosine nodal patterns evaluated in disk logarithmic-map coordinates. These are Chladni-like ornaments, not solved eigenmodes of a hyperbolic drum.',params:{p:7,q:4,depth:32,density:5,shape:1,twist:1,zoom:1.02,width:.7,relief:.2,drift:.15,exposure:2.4},effects:{fillOn:false,embossOn:false,haloOn:false}},
 {name:'Candy Cell Windows',tag:'HYPERBOLIC VORONOI',palette:4,note:'Voronoi cells use exact Poincaré-disk hyperbolic distance to p+q sites. A minimum gap between the nearest two distances draws the cell borders.',params:{p:12,q:5,depth:32,density:5.8,shape:1,twist:1.8,zoom:1.03,width:1.4,relief:.8,drift:.2,exposure:1.8},effects:{embossOn:true,hardPalette:true}},
 {name:'Abyssal Gyroid Ribbons',tag:'GYROID-LIKE / OPAL SLICE',palette:5,note:'A warped slice through the trigonometric gyroid approximation, decorated in logarithmic-map coordinates. This is a 2D shader, not a ray-marched minimal surface.',params:{p:9,q:3,depth:32,density:4.2,shape:2.7,twist:2.2,zoom:1.06,width:1.1,relief:1.6,drift:.5,exposure:2},effects:{embossOn:true,haloOn:true}},
 {name:'Gilded Spiral Reliquary',tag:'HYPERBOLIC RADIUS / ENGRAVING',palette:6,note:'Spirals combine hyperbolic radius 2 atanh(|z|) with angular harmonics and radial modulation. Ornament is analytic; no 3D object is implied.',params:{p:9,q:4,depth:32,density:9,shape:2.2,twist:1.4,zoom:1.03,width:.8,relief:1.2,drift:.1,exposure:2.5},effects:{fillOn:false,embossOn:true,haloOn:true}},
 {name:'Riso Phason Interference',tag:'N-WAVE / APERIODIC-LIKE',palette:7,note:'N-direction cosine waves with a second golden-ratio frequency and independently changing phases, mapped through the disk log map. Not a proof of quasiperiodicity after nonlinear mapping.',params:{p:11,q:3,depth:32,density:6.2,shape:2.1,twist:1.6,zoom:1.04,width:1,relief:0,drift:.3,exposure:2.4},effects:{embossOn:false,haloOn:false,hardPalette:true}},
 {name:'Night Coral Wavegarden',tag:'DISTANCE WAVES / SPIRAL FANS',palette:8,note:'Six analytic spiral-wave sources use hyperbolic distances and local Möbius angles. Coral-like contours are NOT a reaction–diffusion solver or biological growth simulation.',params:{p:8,q:5,depth:32,density:5.7,shape:2.4,twist:2,zoom:1.02,width:1.2,relief:1.1,drift:.4,exposure:2.2},effects:{embossOn:true,haloOn:true}},
 {name:'Copper Inversion Foam',tag:'CIRCLE INVERSION / ORBIT TRAPS',palette:9,note:'Bounded circle inversions, mirror folds and orbit traps inside a navigable hyperbolic disk. An artistic hybrid, not an exact Apollonian circle packing.',params:{p:7,q:3,depth:32,density:7,shape:1.4,twist:.8,zoom:1.04,width:1.6,relief:1.3,drift:.2,exposure:2},effects:{embossOn:true,haloOn:true}}
];
export const OTHERSPACE_DEFAULT={mode:0,projection:0,zoom:1.03,rotation:0,drift:.3,p:7,q:3,depth:36,density:5,shape:1.5,twist:1,phase:0,width:1,relief:1,exposure:2,saturation:1.1,colorPhase:0,colorScale:1,grain:.12,glow:.6,speed:.65,fillOn:true,lineOn:true,detailOn:true,haloOn:true,hardPalette:false,reversePalette:false,animatePalette:false,invertOn:false,scanOn:false,embossOn:true,vignetteOn:true,edgeOn:false,motionOn:true};
