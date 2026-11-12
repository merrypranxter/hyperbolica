import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FIELD_FAMILIES, MESH_FAMILIES, PRESETS } from '../src/presets.js';
import { HYPER_WEAVE_PACK2_PRESETS } from '../src/engines/HyperWeavePack2.js';
import { OTHERSPACE_MODES, OTHERSPACE_PALETTES, OTHERSPACE_DEFAULT } from '../src/otherspace-atlas.js';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const vault=JSON.parse(read('data/mathemagical-palettes.json'));
const names=new Set(vault.palettes.map(p=>p.id));
const html=read('index.html'),main=read('src/main.js');
const shaders=[
  'src/shaders/screen.vert','src/shaders/field.frag',
  'src/shaders/manifold.vert','src/shaders/manifold.frag',
  'src/shaders/glyph.vert','src/shaders/glyph.frag',
  'src/shaders/cathedral.frag','src/shaders/curl-feedback.frag','src/shaders/halftone.frag',
  'src/shaders/astral-field.frag','src/shaders/astral-swarm.vert','src/shaders/astral-swarm.frag',
  'src/shaders/hyperweave-pack2.frag','src/shaders/texture-voronoi.frag',
  'src/shaders/texture-velvet.frag','src/shaders/texture-maximalist.frag',
  'src/shaders/otherspace-atlas.frag'
];

test('all 180 real palettes and colors are present',()=>{
  assert.equal(vault.palettes.length,180);
  assert.equal(names.size,vault.palettes.length);
  for(const p of vault.palettes){
    assert.ok(p.colors.length>=2,p.id);
    assert.ok(p.colors.every(c=>/^#[0-9a-f]{6}$/i.test(c)),p.id);
  }
});
test('the math engines expose distinct families',()=>{
  assert.equal(FIELD_FAMILIES.length,16);
  assert.equal(MESH_FAMILIES.length,12);
  assert.ok(PRESETS.length>=57);
});
test('presets only reference existing palettes and math families',()=>{
  for(const preset of PRESETS){
    assert.ok(names.has(preset.palette),preset.name);
    assert.ok(preset.fieldMode>=0&&preset.fieldMode<FIELD_FAMILIES.length,preset.name);
    assert.ok(preset.meshMode>=0&&preset.meshMode<MESH_FAMILIES.length,preset.name);
  }
});
test('every statically referenced control exists in the HTML',()=>{
  const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]));
  const calls=[...main.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]);
  for(const id of calls){
    if(id.startsWith('out-'))continue;
    assert.ok(ids.has(id),'Missing DOM element: '+id);
  }
});
test('shader sources are present and have balanced delimiters',()=>{
  for(const path of shaders){
    const source=read(path);
    assert.ok(source.includes('void main()'),path);
    for(const [l,r] of [['{','}'],['(',')']]){
      assert.equal([...source].filter(x=>x===l).length,[...source].filter(x=>x===r).length,path);
    }
    assert.equal(source.includes('sinh('),false,path+' has unsupported GLSL 1.00 sinh()');
  }
});
test('opal cathedral is a real transparent fusion with drag-advected memory',()=>{
  const hero=PRESETS.find(p=>p.name.includes('OPAL CATHEDRAL MEMORY GARDEN'));
  assert.ok(hero);
  assert.equal(hero.renderMode,'hybrid');
  assert.equal(hero.material,4);
  assert.ok(hero.opalOpacity>0&&hero.opalOpacity<1);
  assert.ok(hero.feedback>0.1);
  assert.ok(hero.dragCurl>0);
  assert.match(read('src/shaders/manifold.frag'),/u_opacity/);
  assert.match(read('src/shaders/manifold.frag'),/u_transmission/);
  assert.match(read('src/shaders/curl-feedback.frag'),/uGestureVelocity/);
  assert.match(main,/transparent:true,depthWrite:false/);
  assert.match(html,/id="loadOpalCathedral"/);
});
test('Astral four-engine source and five source palettes are preserved',()=>{
  const source=read('legacy/astral-loom-4-engine-original.html');
  assert.match(source,/4-ENGINE PSYCHEDELIC/);
  assert.match(source,/CALABI-YAU 6D/);
  assert.match(source,/TURING-PHYSARUM/);
  assert.match(source,/CROP-CIRCLE ZETA/);
  assert.match(source,/HOPF FERRO-FOAM/);
  assert.equal(vault.palettes.filter(p=>p.source==='astral_loom').length,5);
  const shader=read('src/shaders/astral-field.frag');
  for(const name of ['evalEngine01_CalabiYau','evalEngine02_TuringPhysarum','evalEngine03_CropCircleZeta','evalEngine04_HopfFerroFoam']){
    assert.ok(shader.includes(name),name);
  }
  assert.match(main,/uAstralOpacity/);
  assert.match(main,/makeAstralGeometry/);
  assert.match(html,/data-page="astral"/);
  assert.ok(PRESETS.some(p=>p.renderMode==='astral-cathedral'));
});

test('HyperWeave II imports the actual source JS cartridge and all four GLSL math engines',()=>{
  assert.equal(Object.keys(HYPER_WEAVE_PACK2_PRESETS).length,6);
  const original=read('legacy/hyperweave-pack2-engines-original.frag');
  const live=read('src/shaders/hyperweave-pack2.frag');
  for(const fn of ['evalEngine05_HyperbolicGirih','evalEngine06_CausticNeovius','evalEngine07_JacquardMemphis','evalEngine08_BelousovMycelium']){
    assert.ok(original.includes(fn),fn);
    assert.ok(live.includes(fn),fn);
  }
  assert.equal(vault.palettes.filter(p=>p.source==='hyperweave_pack2').length,1);
  assert.equal(PRESETS.filter(p=>p.renderMode?.startsWith('pack2')).length,6);
  for(const p of PRESETS.filter(p=>p.renderMode?.startsWith('pack2'))){
    assert.ok(p.pack2Morph>=0&&p.pack2Morph<=3,p.name);
    assert.ok(p.pack2Depth>=2,p.name);
  }
});
test('three source-distinct texture generators are wired into real selectable render passes',()=>{
  for(const [htmlSource,shader,signature] of [
    ['legacy/glitch-voronoi-maximalist-original.html','src/shaders/texture-voronoi.frag','voronoi('],
    ['legacy/iridescent-alien-velvet-original.html','src/shaders/texture-velvet.frag','ridgeFBM('],
    ['legacy/maximalist-texture-generator-original.html','src/shaders/texture-maximalist.frag','fbm(']
  ]){
    assert.match(read(htmlSource),/<script id="fragment-shader"/);
    assert.ok(read(shader).includes(signature),shader);
    assert.ok(read(shader).includes('u_layerOpacity'),shader);
    assert.ok(read(shader).includes('u_palette'),shader);
  }
  assert.equal(PRESETS.filter(p=>p.renderMode?.startsWith('texture')).length,6);
  for(const mode of ['pack2','pack2-field','pack2-cathedral','texture','texture-field','texture-cathedral']){
    assert.ok(html.includes('value="'+mode+'"'),mode);
  }
  assert.match(html,/data-page="pack2"/);
  assert.match(html,/data-page="textures"/);
  assert.match(main,/function ensureAddOn/);
  assert.match(main,/renderer\.render\(pack2Scene/);
});
test('OTHERSPACE original ten-mode stand-alone math and palettes are preserved separately',()=>{
  assert.equal(OTHERSPACE_MODES.length,10);
  assert.equal(OTHERSPACE_PALETTES.length,12);
  assert.equal(vault.palettes.filter(p=>p.source==='otherspace').length,12);
  assert.equal(OTHERSPACE_DEFAULT.mode,0);
  for(const mode of OTHERSPACE_MODES){
    assert.ok(mode.name&&mode.note&&mode.params,mode.name);
  }
  const source=read('legacy/otherspace-hyperbolic-starter-atlas-original.html');
  for(const symbol of ['OTHERSPACE','const MODES=','const PALETTES=','function gallery()','function saveRecipe()']){
    assert.ok(source.includes(symbol),symbol);
  }
  assert.ok(source.trimEnd().endsWith('</html>'));
  const shader=read('src/shaders/otherspace-atlas.frag');
  for(const symbol of ['vec2 mobius(','float hd(','vec2 fold(','vec3 field(','atlasOpacity']){
    assert.ok(shader.includes(symbol),symbol);
  }
});
test('OPTIONAL OTHERSPACE background is explicitly OFF in all normal startup art',()=>{
  assert.match(main,/otherSpaceEnabled:false/);
  assert.match(main,/function ensureOtherSpace/);
  assert.match(main,/function loadOtherSpaceStarter/);
  assert.match(main,/renderer.render\(otherSpaceScene,fieldCamera\)/);
  assert.match(main,/state.otherSpaceSolo/);
  assert.match(main,/OTHERSPACE_MODES\.forEach/);
  assert.match(html,/data-page="otherspace"/);
  assert.match(html,/id="otherSpaceOff"/);
  assert.match(html,/id="otherSpaceBlend"/);
  assert.match(html,/id="otherSpaceSolo"/);
  const hero=PRESETS.find(p=>p.name.includes('OPAL CATHEDRAL MEMORY GARDEN'));
  assert.ok(hero);
  assert.ok(!hero.otherSpaceEnabled);
});

test('the cathedral source was preserved as its own reference',()=>{
  const source=read('legacy/hyperloom-nematic-cathedral-original.html');
  assert.match(source,/4D NEMATIC CATHEDRAL/);
  assert.match(source,/DUAL-FBO CURL FLOW/);
  assert.match(source,/PASS 3 FRAGMENT SHADER/);
});

test('uploaded artist source is preserved as its own reference',()=>{
  const legacy=read('legacy/hyperbolic-photoelastic-original.html');
  assert.match(legacy,/HYPERBOLIC PHOTOELASTIC BIOMINERALIZATION/);
  assert.match(legacy,/<script id="fragment-shader"/);
});
