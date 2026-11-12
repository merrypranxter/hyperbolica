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
  'src/shaders/glyph.vert','src/shaders/glyph.frag'
];

test('all 103 real palettes and colors are present',()=>{
  assert.equal(vault.palettes.length,103);
  assert.equal(names.size,vault.palettes.length);
  for(const p of vault.palettes){
    assert.ok(p.colors.length>=2,p.id);
    assert.ok(p.colors.every(c=>/^#[0-9a-f]{6}$/i.test(c)),p.id);
  }
});
test('the math engines expose distinct families',()=>{
  assert.equal(FIELD_FAMILIES.length,16);
  assert.equal(MESH_FAMILIES.length,12);
  assert.ok(PRESETS.length>=24);
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
test('uploaded artist source is preserved as its own reference',()=>{
  const legacy=read('legacy/hyperbolic-photoelastic-original.html');
  assert.match(legacy,/HYPERBOLIC PHOTOELASTIC BIOMINERALIZATION/);
  assert.match(legacy,/<script id="fragment-shader"/);
});
