import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { FIELD_FAMILIES, MESH_FAMILIES, PRESETS } from '../src/presets.js';

const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const vault=JSON.parse(read('data/mathemagical-palettes.json'));
const names=new Set(vault.palettes.map(p=>p.id));
const html=read('index.html'),main=read('src/main.js');
const shaders=[
  'src/shaders/screen.vert','src/shaders/field.frag',
  'src/shaders/manifold.vert','src/shaders/manifold.frag',
  'src/shaders/glyph.vert','src/shaders/glyph.frag',
  'src/shaders/cathedral.frag','src/shaders/curl-feedback.frag','src/shaders/halftone.frag',
  'src/shaders/astral-field.frag','src/shaders/astral-swarm.vert','src/shaders/astral-swarm.frag'
];

test('all 167 real palettes and colors are present',()=>{
  assert.equal(vault.palettes.length,167);
  assert.equal(names.size,vault.palettes.length);
  for(const p of vault.palettes){
    assert.ok(p.colors.length>=2,p.id);
    assert.ok(p.colors.every(c=>/^#[0-9a-f]{6}$/i.test(c)),p.id);
  }
});
test('the math engines expose distinct families',()=>{
  assert.equal(FIELD_FAMILIES.length,16);
  assert.equal(MESH_FAMILIES.length,12);
  assert.ok(PRESETS.length>=42);
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
test('the cathedral source was preserved as its own reference',()=>{
  const source=read('legacy/hyperloom-nematic-cathedral-original.html');
  assert.match(source,/4D NEMATIC CATHEDRAL/);
  assert.match(source,/DUAL-FBO CURL FLOW/);
  assert.match(source,/PASS 3 FRAGMENT SHADER/);
});

test('astral loom original source and all five ink palettes are preserved',()=>{
  const original=read('legacy/astral-loom-4-engine-original.html');
  assert.match(original,/CALABI-YAU 6D/);
  assert.match(original,/TURING-PHYSARUM/);
  assert.match(original,/CROP-CIRCLE ZETA/);
  assert.match(original,/HOPF FERRO-FOAM/);
  assert.equal(vault.palettes.filter(x=>x.source==='astral_loom').length,5);
  const astral=read('src/shaders/astral-field.frag');
  for(const engine of ['evalEngine01_CalabiYau','evalEngine02_TuringPhysarum','evalEngine03_CropCircleZeta','evalEngine04_HopfFerroFoam']){
    assert.ok(astral.includes(engine),engine);
  }
});
test('opal cathedral is actually configured with translucent shell and curl memory',()=>{
  const p=PRESETS.find(p=>p.name.startsWith('32 ·'));
  assert.ok(p);
  assert.equal(p.renderMode,'hybrid');
  assert.equal(p.material,4);
  assert.ok(p.translucency>.5);
  assert.ok(p.feedback>.5);
  assert.ok(p.curlStrength>1);
  assert.ok(main.includes('applyPreset(32);'));
  assert.ok(read('src/shaders/curl-feedback.frag').includes('uDragVelocity'));
  assert.ok(read('src/shaders/manifold.frag').includes('u_translucency'));
});
test('uploaded artist source is preserved as its own reference',()=>{
  const legacy=read('legacy/hyperbolic-photoelastic-original.html');
  assert.match(legacy,/HYPERBOLIC PHOTOELASTIC BIOMINERALIZATION/);
  assert.match(legacy,/<script id="fragment-shader"/);
});
