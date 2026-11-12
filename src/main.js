import * as THREE from 'three';
import './style.css';
import paletteLibrary from '../data/mathemagical-palettes.json';
import screenVertex from './shaders/screen.vert?raw';
import fieldFragment from './shaders/field.frag?raw';
import manifoldVertex from './shaders/manifold.vert?raw';
import manifoldFragment from './shaders/manifold.frag?raw';
import glyphVertex from './shaders/glyph.vert?raw';
import glyphFragment from './shaders/glyph.frag?raw';
import cathedralFragment from './shaders/cathedral.frag?raw';
import feedbackFragment from './shaders/curl-feedback.frag?raw';
import printFragment from './shaders/halftone.frag?raw';
import { FIELD_FAMILIES, MESH_FAMILIES, PRESETS } from './presets.js';

const $ = id => document.getElementById(id);
const mobile = matchMedia('(max-width: 800px), (pointer: coarse)').matches;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const copy=x=>JSON.parse(JSON.stringify(x));
const paletteList=paletteLibrary.palettes;
const defaultState={
  fieldMode:0,meshMode:0,paletteId:'itsamoire/acid',renderMode:'field',
  hybridMix:0.55,rot4D:1.15,cathedralApollo:1.38,chladniFreq:6.50,
  volumetricGlow:1.55,schlierenFreq:6.80,flySpeed:0.85,rayQuality:mobile?0:1,
  feedback:0,curlStrength:1.0,halftoneMix:0,halftoneScale:110,
  acidOverdrive:1.0,dispersion:0,paletteInkMix:1,chromaLock:0,
  symmetry:7,density:4.5,iterations:12,inversion:0.45,warp:1.0,morph:1.25,zoom:1.35,
  iridescence:5.5,saturation:2.4,moire:1.0,glitch:0.12,material:0,porosity:0.16,
  opalOpacity:1,opalTransmission:0.48,opalThickness:0.65,opalGlow:0.55,dragCurl:1.25,
  palettePhase:0,speed:0.72,swarmSize:1.1,swarmFlow:0.9,swarmCount:mobile?1800:5500,
  cameraDrift:0.04,quality:mobile?1.5:2.0,gestureMode:'orbit',
  layerBg:true,layerMesh:true,layerSwarm:true,paused:false,seed:761235
};
const state=copy(defaultState);
const cameraMotion={
  theta:0.3,phi:0.22,targetTheta:0.3,targetPhi:0.22,
  radius:5.1,targetRadius:5.1,
  pointerX:0,pointerY:0,targetX:0,targetY:0,
  touch:0,targetTouch:0,
  gestureX:0,gestureY:0,targetGestureX:0,targetGestureY:0,gesturePower:0,targetGesturePower:0
};
const pointers=new Map();
let lastPinch=0;
let renderer,scene,camera,fieldScene,fieldCamera,fieldMesh,mesh,swarm;
let fieldMaterial,meshMaterial,swarmMaterial,texture;
let cathedralScene,feedbackScene,printScene;
let cathedralMaterial,feedbackMaterial,printMaterial;
let sceneRT=null,historyReadRT=null,historyWriteRT=null;
let postW=0,postH=0;
let editedColors=null,selectedPreset=0;
let t=0,lastStamp=performance.now(),frames=0,lastFpsStamp=lastStamp,fps=0;
let lastToastTimer=0,recorder=null,recordTimer=0,discardRecording=false;
const MAX_SPRITES=14000;
const statusEl=$('status');
const sliderDefs={
  structure:[
    ['symmetry','KALEIDOSCOPE / SYMMETRY',3,24,1],
    ['density','PORE / FILIGREE DENSITY',0.5,14,0.1],
    ['iterations','FRACTAL RECURSION STEPS',2,12,1],
    ['inversion','APOLLONIAN INVERSION',0.05,1.2,0.01],
    ['warp','COMPLEX-PLANE DISTORTION',0,3,0.05],
    ['morph','STRUCTURAL MORPH AMPLITUDE',0,2.5,0.05],
    ['zoom','FIELD ZOOM',0.25,4.5,0.05]
  ],
  optics:[
    ['iridescence','BIREFRINGENCE / OPAL STRESS',0.1,12,0.1],
    ['saturation','CHROMATIC OVERDRIVE',0.2,3.8,0.05],
    ['moire','SCREEN / MOIRÉ MIX',0,4,0.05],
    ['glitch','VHS / CHROMATIC TEAR',0,1.5,0.01],
    ['porosity','3D SHELL OPENINGS',0,1.5,0.05],
    ['opalOpacity','OPAL SHELL TRANSPARENCY',0.12,1,0.02],
    ['opalTransmission','PEARLESCENT TRANSMISSION',0,1.5,0.05],
    ['opalThickness','THIN-FILM LAYER THICKNESS',0,2.5,0.05],
    ['opalGlow','WET FRESNEL / EDGE GLOW',0,2.5,0.05]
  ],
  palette:[['palettePhase','PALETTE PHASE POSITION',0,1,0.01]],
  cathedral:[
    ['hybridMix','BIOMINERAL FIELD OVERLAY MIX',0,1,0.05],
    ['rot4D','4D POLYCHORON ROTATION',0,3,0.05],
    ['cathedralApollo','4D APOLLONIAN INVERSION',0.2,2.5,0.02],
    ['chladniFreq','NODAL SILICA / CHLADNI DENSITY',1,16,0.25],
    ['volumetricGlow','BIOLUMINESCENT PLASMA',0,3,0.05],
    ['schlierenFreq','ACTIVE NEMATIC SCHLIEREN',1,15,0.2],
    ['flySpeed','CATHEDRAL FORWARD / BACK FLIGHT',-2,3,0.05],
    ['rayQuality','RAY STEPS · 0=FAST, 2=FULL',0,2,1]
  ],
  feedback:[
    ['feedback','TEMPORAL CURL TRAILS',0,0.92,0.02],
    ['curlStrength','ADVECTIVE FLOW / CURL',0,3,0.05],
    ['dragCurl','DRAG-DRIVEN CURL IMPULSE',0,3,0.05],
    ['halftoneMix','FOUR-ANGLE SCREEN PRINT',0,1,0.02],
    ['halftoneScale','SCREEN-PRINT DOT FREQUENCY',30,220,2],
    ['acidOverdrive','PRINT CHROMA DRIVE',0.5,3.5,0.05],
    ['dispersion','PRISMATIC / VHS TEAR',0,2,0.02],
    ['chromaLock','DARK NEON LOCK · 0=FAITHFUL',0,1,0.05]
  ],
  motion:[
    ['speed','MATHEMATICAL TIME SPEED',0,3,0.05],
    ['swarmSize','SWARM PARTICLE SIZE',0,3,0.05],
    ['swarmFlow','HOPF SWARM VELOCITY',0,3,0.05],
    ['swarmCount','ACTIVE GPU INSTANCES',0,14000,200],
    ['cameraDrift','IDLE CAMERA DRIFT',0,0.4,0.01],
    ['quality','RENDER PIXEL RATIO CAP',0.8,2.5,0.1]
  ]
};
const sliderInputs={};

function notify(message){
  const toast=$('toast');toast.textContent=message;toast.classList.add('visible');
  clearTimeout(lastToastTimer);
  lastToastTimer=setTimeout(()=>toast.classList.remove('visible'),2500);
}
function setFatal(err){
  $('fatal').hidden=false;
  $('errorText').textContent=err instanceof Error?(err.stack||err.message):String(err);
  statusEl.textContent='RENDERER STOPPED — INSPECT ERROR';
}
function chooseOption(select,value,label){
  const option=document.createElement('option');option.value=String(value);option.textContent=label;select.append(option);
}
function fillSelections(){
  $('paletteCountLabel').textContent=paletteList.length+' MATHEMAGICAL PALETTES';
  FIELD_FAMILIES.forEach((name,i)=>chooseOption($('fieldMode'),i,name));
  MESH_FAMILIES.forEach((name,i)=>chooseOption($('meshMode'),i,name));
  PRESETS.forEach((p,i)=>chooseOption($('presetSelect'),i,p.name));
  const sources=[...new Set(paletteList.map(p=>p.source))];
  sources.sort((a,b)=>a.localeCompare(b));
  for(const source of sources)chooseOption($('paletteSource'),source,source.replaceAll('_',' ').toUpperCase());
  refreshPaletteOptions();
}
function refreshPaletteOptions(){
  const picker=$('paletteSelect');picker.replaceChildren();
  const filtered=paletteList.filter(p=>$('paletteSource').value==='all'||p.source===$('paletteSource').value);
  for(const p of filtered)chooseOption(picker,p.id,p.name+' · '+p.source);
  if(filtered.some(p=>p.id===state.paletteId))picker.value=state.paletteId;
  else if(filtered.length)picker.value=filtered[0].id;
}
function makeSliders(){
  for(const [group,rows] of Object.entries(sliderDefs)){
    const host=$(group==='palette'?'paletteSliders':group+'Sliders');
    for(const [key,label,min,max,step] of rows){
      const root=document.createElement('div');root.className='sliderField';
      const head=document.createElement('div');head.className='head';
      const text=document.createElement('span');text.textContent=label;
      const value=document.createElement('output');value.id='out-'+key;
      head.append(text,value);
      const slider=document.createElement('input');slider.type='range';slider.min=min;slider.max=max;slider.step=step;
      slider.value=state[key];slider.setAttribute('aria-label',label);
      root.append(head,slider);host.append(root);
      sliderInputs[key]=slider;
      slider.addEventListener('input',()=>{
        state[key]=Number(slider.value);
        value.textContent=String(state[key]);
        if(key==='quality')resize();
        if(key==='swarmCount')setSpriteCount();
    if(key==='feedback')clearTrails();
      });
    }
  }
}
function getPalette(){
  return paletteList.find(p=>p.id===state.paletteId)||paletteList[0];
}
function currentPaletteColors(){
  return editedColors&&editedColors.length?editedColors:getPalette().colors;
}
function makePaletteTexture(colors){
  const n=256,bytes=new Uint8Array(n*4);
  // Stop interpolation in gamma-coded RGB, preserving the original visible swatches.
  const decoded=colors.map(hex=>[
    parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)
  ]);
  for(let i=0;i<n;i++){
    let f=(i/n)*decoded.length,j=Math.floor(f),mix=f-j;
    const a=decoded[j%decoded.length],b=decoded[(j+1)%decoded.length];
    for(let k=0;k<3;k++)bytes[i*4+k]=Math.round(a[k]*(1-mix)+b[k]*mix);
    bytes[i*4+3]=255;
  }
  const tex=new THREE.DataTexture(bytes,n,1,THREE.RGBAFormat);
  tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.ClampToEdgeWrapping;
  tex.magFilter=THREE.LinearFilter;tex.minFilter=THREE.LinearFilter;
  tex.generateMipmaps=false;tex.needsUpdate=true;
  return tex;
}
function updatePaletteTexture(rebuildEditors=true){
  const next=makePaletteTexture(currentPaletteColors());
  if(fieldMaterial)fieldMaterial.uniforms.u_palette.value=next;
  if(meshMaterial)meshMaterial.uniforms.u_palette.value=next;
  if(swarmMaterial)swarmMaterial.uniforms.u_palette.value=next;
  if(cathedralMaterial)cathedralMaterial.uniforms.uPalette.value=next;
  if(printMaterial)printMaterial.uniforms.uPalette.value=next;
  if(texture)texture.dispose();
  texture=next;
  if(rebuildEditors)renderPaletteEditors();
}
function renderPaletteEditors(){
  const colors=currentPaletteColors(),swatches=$('paletteSwatches'),editors=$('paletteStopEditors');
  swatches.replaceChildren();editors.replaceChildren();
  colors.forEach((hex,i)=>{
    const swatch=document.createElement('span');swatch.style.background=hex;swatch.title=hex;swatches.append(swatch);
    const label=document.createElement('label');label.textContent=String(i+1);
    const input=document.createElement('input');input.type='color';input.value=hex;input.title='Edit color '+String(i+1);
    input.addEventListener('input',()=>{
      if(!editedColors)editedColors=[...getPalette().colors];
      editedColors[i]=input.value;
      updatePaletteTexture(false);
      if(swatches.children[i])swatches.children[i].style.background=input.value;
    });
    label.append(input);editors.append(label);
  });
  $('paletteSelect').value=state.paletteId;
}
function pickPalette(id,clearEdits=true,keepSource=false){
  if(!paletteList.some(p=>p.id===id))return;
  state.paletteId=id;if(clearEdits)editedColors=null;
  if(!keepSource)$('paletteSource').value='all';
  refreshPaletteOptions();updatePaletteTexture();
}
function shufflePalette(){
  const pool=paletteList.filter(p=>$('paletteSource').value==='all'||p.source===$('paletteSource').value);
  if(!pool.length)return;
  let next=pool[Math.floor(Math.random()*pool.length)];
  if(pool.length>1&&next.id===state.paletteId)next=pool[(pool.indexOf(next)+1)%pool.length];
  pickPalette(next.id,true,true);notify('PALETTE MUTATED — '+next.name);
}
function shuffleStops(){
  editedColors=[...currentPaletteColors()];
  for(let i=editedColors.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[editedColors[i],editedColors[j]]=[editedColors[j],editedColors[i]];}
  updatePaletteTexture();notify('PALETTE STOP ORDER REMIXED');
}
function syncControls(){
  $('fieldMode').value=String(state.fieldMode);
  $('meshMode').value=String(state.meshMode);
  $('materialMode').value=String(state.material);
  $('gestureMode').value=state.gestureMode;
  $('renderMode').value=state.renderMode;
  $('renderModeCathedral').value=state.renderMode;
  $('inkMode').value=String(state.paletteInkMix);
  for(const [key,slider] of Object.entries(sliderInputs)){
    slider.value=state[key];$('out-'+key).textContent=String(state[key]);
  }
  [['bgToggle','layerBg'],['meshToggle','layerMesh'],['swarmToggle','layerSwarm']].forEach(([id,k])=>$(id).classList.toggle('selected',state[k]));
  if(mesh)mesh.visible=state.layerMesh;
  if(swarm)swarm.visible=state.layerSwarm;
  setSpriteCount();
}
function applyPreset(index){
  const preset=PRESETS[index];if(!preset)return;
  const base=copy(defaultState);
  const keepLayers={};
  for(const key of ['layerBg','layerMesh','layerSwarm']){
    if(!Object.hasOwn(preset,key))keepLayers[key]=state[key];
  }
  Object.assign(state,base,preset,keepLayers);
  // User's layer toggle settings are intentionally not reset by presets.
  delete state.name;delete state.detail;delete state.palette;
  state.paletteId=preset.palette;
  selectedPreset=index;
  $('presetSelect').value=String(index);
  $('presetInfo').textContent=preset.detail;
  editedColors=null;pickPalette(state.paletteId);syncControls();clearTrails();
  notify('LOADED — '+preset.name);
}
function seededRng(){
  let seed=(Number(state.seed)>>>0)||1;
  return ()=>{
    seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
    state.seed=seed>>>0;
    return (state.seed>>>0)/4294967296;
  };
}
function mutate(onlyStructure=false){
  const rand=seededRng();
  if(!onlyStructure){
    const modePick=rand();
    state.renderMode=modePick<0.22?'cathedral':modePick<0.38?'hybrid':'field';
    state.rot4D=Number((rand()*3).toFixed(2));
    state.cathedralApollo=Number((.45+rand()*1.9).toFixed(2));
    state.chladniFreq=Number((1.5+rand()*14).toFixed(2));
    state.volumetricGlow=Number((.25+rand()*2.55).toFixed(2));
    state.schlierenFreq=Number((1.2+rand()*13.2).toFixed(2));
    state.flySpeed=Number((.15+rand()*1.8).toFixed(2));
    state.hybridMix=Number((.3+rand()*.5).toFixed(2));
    state.feedback=Number((rand()*.67).toFixed(2));
    state.halftoneMix=Number((rand()*.8).toFixed(2));
    state.halftoneScale=30+Math.floor(rand()*95)*2;
    state.dispersion=Number((rand()*.45).toFixed(2));
    state.acidOverdrive=Number((1+rand()*1.65).toFixed(2));
    clearTrails();
  }
  state.fieldMode=Math.floor(rand()*FIELD_FAMILIES.length);
  state.meshMode=Math.floor(rand()*MESH_FAMILIES.length);
  state.symmetry=3+Math.floor(rand()*22);
  state.density=Number((1.1+rand()*11.5).toFixed(2));
  state.iterations=6+Math.floor(rand()*7);
  state.inversion=Number((.1+rand()*.8).toFixed(2));
  state.warp=Number((rand()*2.6).toFixed(2));
  state.morph=Number((.35+rand()*1.95).toFixed(2));
  state.zoom=Number((.65+rand()*1.7).toFixed(2));
  if(!onlyStructure){
    state.material=Math.floor(rand()*5);
    state.iridescence=Number((2+rand()*8.4).toFixed(2));
    state.moire=Number((rand()*2.7).toFixed(2));
    state.porosity=Number((rand()*1.2).toFixed(2));
    state.glitch=Number((rand()*.58).toFixed(2));
    state.swarmSize=Number((.55+rand()*1.75).toFixed(2));
    state.swarmFlow=Number((.35+rand()*1.65).toFixed(2));
  }
  syncControls();
  notify(onlyStructure?'TOPOLOGY + FIELD GENOME MUTATED':'ALL MATHEMATICS MUTATED');
}

function makeScreenMaterial(fragmentShader, uniforms){
  return new THREE.ShaderMaterial({
    vertexShader:screenVertex,
    fragmentShader,
    depthTest:false,depthWrite:false,
    uniforms
  });
}
function buildEffects(){
  const vec=()=>({value:new THREE.Vector2()});
  const pass=(fragmentShader, uniforms)=>{
    const mat=makeScreenMaterial(fragmentShader,uniforms);
    const stage=new THREE.Scene();
    const plane=new THREE.Mesh(new THREE.PlaneGeometry(2,2),mat);
    plane.frustumCulled=false;
    stage.add(plane);
    return [stage,mat];
  };
  [cathedralScene,cathedralMaterial]=pass(cathedralFragment,{
    uResolution:vec(),uTime:{value:0},uMouse:vec(),uZoom:{value:1},
    uSymmetry:{value:7},u4DRotation:{value:1.15},uApollonian:{value:1.38},
    uChladniFreq:{value:6.5},uVolumetricGlow:{value:1.55},
    uSchlierenFreq:{value:6.8},uFlySpeed:{value:.85},
    uPalette:{value:texture},uPalettePhase:{value:0},
    uRayQuality:{value:1},uChromaLock:{value:0}
  });
  [feedbackScene,feedbackMaterial]=pass(feedbackFragment,{
    uCurrentSceneTex:{value:null},uHistoryTex:{value:null},
    uResolution:vec(),uTime:{value:0},uMouse:vec(),
    uFeedback:{value:0},uSchlierenFreq:{value:6.8},uCurlStrength:{value:1},
    uGestureVelocity:{value:new THREE.Vector2()},uGesturePower:{value:0}
  });
  [printScene,printMaterial]=pass(printFragment,{
    uAccumulatedTex:{value:null},uResolution:vec(),uTime:{value:0},
    uHalftoneMix:{value:0},uHalftoneScale:{value:110},
    uAcidOverdrive:{value:1},uDispersion:{value:0},
    uPalette:{value:texture},uPalettePhase:{value:0},
    uPaletteInkMix:{value:1},uChromaLock:{value:0}
  });
}
function disposeRenderTargets(){
  for(const rt of [sceneRT,historyReadRT,historyWriteRT]){
    if(rt)rt.dispose();
  }
  sceneRT=historyReadRT=historyWriteRT=null;
  postW=postH=0;
}
function ensureRenderTargets(){
  const cw=renderer.domElement.width,ch=renderer.domElement.height;
  // Cap all THREE render target allocations for Safari/GPU memory pressure.
  const maxPixels=mobile?780000:2000000;
  const shrink=Math.min(1,Math.sqrt(maxPixels/Math.max(1,cw*ch)));
  const w=Math.max(1,Math.round(cw*shrink)),h=Math.max(1,Math.round(ch*shrink));
  if(sceneRT&&postW===w&&postH===h)return;
  disposeRenderTargets();
  const opts={format:THREE.RGBAFormat,type:THREE.UnsignedByteType,depthBuffer:false,stencilBuffer:false,
    magFilter:THREE.LinearFilter,minFilter:THREE.LinearFilter,generateMipmaps:false};
  sceneRT=new THREE.WebGLRenderTarget(w,h,{...opts,depthBuffer:true});
  historyReadRT=new THREE.WebGLRenderTarget(w,h,opts);
  historyWriteRT=new THREE.WebGLRenderTarget(w,h,opts);
  postW=w;postH=h;
  clearTrails();
}
function clearTrails(){
  if(!renderer||!historyReadRT||!historyWriteRT)return;
  const existingTarget=renderer.getRenderTarget();
  const priorColor=renderer.getClearColor(new THREE.Color()).clone();
  const priorAlpha=renderer.getClearAlpha();
  renderer.setClearColor(0x000000,1);
  for(const target of [historyReadRT,historyWriteRT]){
    renderer.setRenderTarget(target);
    renderer.clear(true,true,true);
  }
  renderer.setRenderTarget(existingTarget);
  renderer.setClearColor(priorColor,priorAlpha);
}
function configureEffects(usingPost=true){
  if(!cathedralMaterial)return;
  const p=cameraMotion;
  const c=cathedralMaterial.uniforms;
  const effectW=usingPost?postW:renderer.domElement.width;
  const effectH=usingPost?postH:renderer.domElement.height;
  c.uResolution.value.set(effectW,effectH);
  c.uTime.value=t;c.uMouse.value.set(p.pointerX,p.pointerY);
  c.uZoom.value=5.1/p.radius;
  c.uSymmetry.value=state.symmetry;c.u4DRotation.value=state.rot4D;
  c.uApollonian.value=state.cathedralApollo;c.uChladniFreq.value=state.chladniFreq;
  c.uVolumetricGlow.value=state.volumetricGlow;c.uSchlierenFreq.value=state.schlierenFreq;
  c.uFlySpeed.value=state.flySpeed;c.uPalettePhase.value=state.palettePhase;
  c.uRayQuality.value=state.rayQuality;c.uChromaLock.value=state.chromaLock;
  const f=feedbackMaterial.uniforms;
  f.uResolution.value.set(effectW,effectH);
  f.uTime.value=t;f.uMouse.value.set(p.pointerX,p.pointerY);
  f.uFeedback.value=state.feedback;f.uCurlStrength.value=state.curlStrength;
  f.uGestureVelocity.value.set(p.gestureX,p.gestureY);
  f.uGesturePower.value=p.gesturePower*state.dragCurl;
  f.uSchlierenFreq.value=state.schlierenFreq;
  const h=printMaterial.uniforms;
  h.uResolution.value.set(effectW,effectH);
  h.uTime.value=t;h.uHalftoneMix.value=state.halftoneMix;
  h.uHalftoneScale.value=state.halftoneScale;
  h.uAcidOverdrive.value=state.acidOverdrive;
  h.uDispersion.value=state.dispersion;
  h.uPaletteInkMix.value=state.paletteInkMix;
  h.uPalettePhase.value=state.palettePhase;
  h.uChromaLock.value=state.chromaLock;
}
function renderBaseScene(){
  renderer.clear(true,true,true);
  if(state.layerBg){
    if(state.renderMode!=='field'){
      renderer.render(cathedralScene,fieldCamera);
    }
    if(state.renderMode!=='cathedral'){
      fieldMaterial.uniforms.u_fieldOpacity.value=state.renderMode==='hybrid'?state.hybridMix:1.0;
      renderer.render(fieldScene,fieldCamera);
    }
  }
  renderer.clearDepth();
  if(state.layerMesh||state.layerSwarm)renderer.render(scene,camera);
}

function makeGeometry(us,vs){
  const pos=new Float32Array((us+1)*(vs+1)*3);
  const uv=new Float32Array((us+1)*(vs+1)*2);
  const param=new Float32Array((us+1)*(vs+1)*2);
  const indices=[];
  let a=0,b=0;
  for(let i=0;i<=us;i++)for(let j=0;j<=vs;j++){
    const u=i/us*Math.PI*2,v=j/vs*Math.PI*2;
    pos[a++]=Math.cos(u);pos[a++]=Math.sin(u);pos[a++]=Math.cos(v);
    const k=b;uv[k]=i/us;uv[k+1]=j/vs;param[k]=u;param[k+1]=v;b+=2;
  }
  for(let i=0;i<us;i++)for(let j=0;j<vs;j++){
    const a=i*(vs+1)+j,b=(i+1)*(vs+1)+j;
    indices.push(a,b,a+1,b,b+1,a+1);
  }
  const g=new THREE.BufferGeometry();
  g.setIndex(indices);
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  g.setAttribute('a_uvParam',new THREE.BufferAttribute(param,2));
  return g;
}
function makeSwarmGeometry(){
  const plane=new THREE.PlaneGeometry(1,1);
  const g=new THREE.InstancedBufferGeometry();
  g.setIndex(plane.getIndex());
  g.setAttribute('position',plane.getAttribute('position'));
  g.setAttribute('uv',plane.getAttribute('uv'));
  const orbit=new Float32Array(MAX_SPRITES*4),glyph=new Float32Array(MAX_SPRITES*4);
  let rng=0x23ab9319;
  const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
  const goldenAngle=Math.PI*(3-Math.sqrt(5));
  for(let i=0;i<MAX_SPRITES;i++){
    const j=i*4,frac=i/MAX_SPRITES;
    orbit[j]=(i*goldenAngle)%(Math.PI*2);
    orbit[j+1]=(frac*Math.PI*2*13)%(Math.PI*2);
    orbit[j+2]=Math.pow(random(),.72);
    orbit[j+3]=(0.45+random()*1.15)*(i%2?-1:1);
    glyph[j]=i%6;glyph[j+1]=random();
    glyph[j+2]=.026+Math.pow(random(),2.2)*.09;
    glyph[j+3]=1+(i%5)*.5;
  }
  g.setAttribute('a_orbit',new THREE.InstancedBufferAttribute(orbit,4));
  g.setAttribute('a_glyph',new THREE.InstancedBufferAttribute(glyph,4));
  g.instanceCount=state.swarmCount;
  return g;
}
function setSpriteCount(){
  if(swarm&&swarm.geometry)swarm.geometry.instanceCount=clamp(Math.round(state.swarmCount),0,MAX_SPRITES);
}
function initRenderer(){
  renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',preserveDrawingBuffer:true,alpha:false});
  renderer.setClearColor(0x05010d,1);renderer.autoClear=false;
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  $('canvasMount').append(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost',e=>{
    e.preventDefault();setFatal('WebGL context was lost. Tap Retry to reinitialize the artwork.');
  });
  renderer.domElement.addEventListener('webglcontextrestored',()=>location.reload());
  texture=makePaletteTexture(getPalette().colors);
  buildEffects();
  fieldScene=new THREE.Scene();fieldCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  fieldMaterial=new THREE.ShaderMaterial({
    vertexShader:screenVertex,fragmentShader:fieldFragment,
    transparent:true,depthTest:false,depthWrite:false,extensions:{derivatives:true},
    uniforms:{
      u_resolution:{value:new THREE.Vector2(800,800)},u_palette:{value:texture},
      u_pointer:{value:new THREE.Vector2()},
      u_time:{value:0},u_family:{value:0},u_symmetry:{value:7},u_density:{value:4},
      u_iterations:{value:12},u_inversion:{value:.45},u_warp:{value:1},
      u_morph:{value:1},u_iridescence:{value:5},u_saturation:{value:2},
      u_moire:{value:1},u_glitch:{value:0},u_zoom:{value:1},u_seed:{value:1},
      u_phase:{value:0},u_touch:{value:0},u_fieldOpacity:{value:1}
    }
  });
  fieldMesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),fieldMaterial);
  fieldMesh.frustumCulled=false;fieldScene.add(fieldMesh);
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(52,1,.1,100);
  meshMaterial=new THREE.ShaderMaterial({
    vertexShader:manifoldVertex,fragmentShader:manifoldFragment,
    side:THREE.DoubleSide,transparent:true,depthWrite:false,extensions:{derivatives:true},
    uniforms:{
      u_palette:{value:texture},u_pointer:{value:new THREE.Vector2()},
      u_time:{value:0},u_mode:{value:0},u_symmetry:{value:7},
      u_morph:{value:1},u_density:{value:4},u_touch:{value:0},u_seed:{value:1},
      u_iridescence:{value:5},u_saturation:{value:2},
      u_material:{value:0},u_porosity:{value:0},u_moire:{value:0},u_phase:{value:0},
      u_opacity:{value:1},u_transmission:{value:0.48},u_opalThickness:{value:0.65},u_opalGlow:{value:0.55}
    }
  });
  mesh=new THREE.Mesh(makeGeometry(mobile?96:164,mobile?48:82),meshMaterial);
  mesh.frustumCulled=false;scene.add(mesh);
  swarmMaterial=new THREE.ShaderMaterial({
    vertexShader:glyphVertex,fragmentShader:glyphFragment,
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
    uniforms:{
      u_palette:{value:texture},u_pointer:{value:new THREE.Vector2()},
      u_time:{value:0},u_swarmSize:{value:1},u_swarmFlow:{value:1},u_morph:{value:1},
      u_touch:{value:0},u_iridescence:{value:5},u_saturation:{value:2},u_phase:{value:0}
    }
  });
  swarm=new THREE.Mesh(makeSwarmGeometry(),swarmMaterial);swarm.frustumCulled=false;scene.add(swarm);
  setupInteraction();
  resize();
  // Fail visibly instead of leaving the artist staring at a mysterious black canvas.
  const shaderFailures=[];
  const normalError=console.error;
  console.error=(...args)=>{
    const message=args.map(a=>String(a)).join(' ');
    if(message.includes('THREE.WebGLProgram')||message.includes('Shader Error'))shaderFailures.push(message);
    normalError.apply(console,args);
  };
  try{
    renderer.compile(fieldScene,fieldCamera);
    renderer.compile(scene,camera);
  }finally{console.error=normalError;}
  if(shaderFailures.length)throw new Error('GPU shader compilation failed: '+shaderFailures.join('\n').slice(0,3500));
  window.addEventListener('resize',resize);
  if(window.ResizeObserver)new ResizeObserver(resize).observe($('canvasMount'));
  statusEl.textContent='GPU READY · THREE.JS / GLSL · FIELD + 3D + SWARM';
  $('renderInfo').textContent='WebGL '+(renderer.capabilities.isWebGL2?'2':'1')+' · '+paletteList.length+' local palettes · no paid APIs';
}
function resize(){
  if(!renderer||!camera)return;
  const box=$('canvasMount').getBoundingClientRect();
  const w=Math.max(1,Math.round(box.width)),h=Math.max(1,Math.round(box.height));
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,state.quality));
  renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.updateProjectionMatrix();
  fieldMaterial.uniforms.u_resolution.value.set(renderer.domElement.width,renderer.domElement.height);
}
function setupInteraction(){
  const canvas=renderer.domElement;
  const coord=(e)=>{
    const rect=canvas.getBoundingClientRect();
    cameraMotion.targetX=clamp((e.clientX-rect.left)/rect.width*2-1,-1,1);
    cameraMotion.targetY=clamp(1-(e.clientY-rect.top)/rect.height*2,-1,1);
  };
  canvas.addEventListener('pointerdown',e=>{
    canvas.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    coord(e);cameraMotion.targetTouch=Math.max(cameraMotion.targetTouch,.25);
  });
  canvas.addEventListener('pointermove',e=>{
    coord(e);
    const old=pointers.get(e.pointerId);
    if(!old)return;
    const dx=e.clientX-old.x,dy=e.clientY-old.y;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(state.gestureMode!=='orbitOnly' && pointers.size===1){
      const bounds=canvas.getBoundingClientRect();
      const vx=clamp(dx/Math.max(1,bounds.width)*18,-1.5,1.5);
      const vy=clamp(-dy/Math.max(1,bounds.height)*18,-1.5,1.5);
      cameraMotion.targetGestureX=vx;
      cameraMotion.targetGestureY=vy;
      cameraMotion.targetGesturePower=clamp(Math.hypot(vx,vy)*1.3,0,1.5);
    }
    if(pointers.size===2){
      const arr=[...pointers.values()];
      const dist=Math.hypot(arr[0].x-arr[1].x,arr[0].y-arr[1].y);
      if(lastPinch>0)cameraMotion.targetRadius=clamp(cameraMotion.targetRadius*lastPinch/Math.max(1,dist),2.4,12);
      lastPinch=dist;return;
    }
    lastPinch=0;
    if(state.gestureMode!=='sculpt'){
      cameraMotion.targetTheta-=dx*.0065;
      cameraMotion.targetPhi=clamp(cameraMotion.targetPhi+dy*.0065,-1.38,1.38);
    }
    if(state.gestureMode!=='orbitOnly'){
      cameraMotion.targetTouch=clamp(cameraMotion.targetTouch+Math.hypot(dx,dy)*.014,0,1.8);
    }
  });
  const end=e=>{pointers.delete(e.pointerId);lastPinch=0;if(pointers.size===0)cameraMotion.targetTouch=0;};
  canvas.addEventListener('pointerup',end);
  canvas.addEventListener('pointercancel',end);
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    cameraMotion.targetRadius=clamp(cameraMotion.targetRadius+e.deltaY*.004,2.4,12);
  },{passive:false});
  canvas.addEventListener('dblclick',()=>resetView());
}
function resetView(){
  cameraMotion.targetTheta=.3;cameraMotion.targetPhi=.22;cameraMotion.targetRadius=5.1;
  cameraMotion.targetX=0;cameraMotion.targetY=0;cameraMotion.targetTouch=0;notify('CAMERA + WARP POLE CENTERED');
}
function useUniforms(){
  if(!fieldMaterial)return;
  const p=cameraMotion;
  for(const mat of [fieldMaterial,meshMaterial,swarmMaterial]){
    const u=mat.uniforms;
    if(u.u_time)u.u_time.value=t;
    if(u.u_pointer)u.u_pointer.value.set(p.pointerX,p.pointerY);
    if(u.u_touch)u.u_touch.value=p.touch;
    if(u.u_symmetry)u.u_symmetry.value=state.symmetry;
    if(u.u_density)u.u_density.value=state.density;
    if(u.u_morph)u.u_morph.value=state.morph;
    if(u.u_iridescence)u.u_iridescence.value=state.iridescence;
    if(u.u_saturation)u.u_saturation.value=state.saturation;
    if(u.u_moire)u.u_moire.value=state.moire;
    if(u.u_phase)u.u_phase.value=state.palettePhase;
    if(u.u_seed)u.u_seed.value=state.seed;
  }
  const f=fieldMaterial.uniforms;
  f.u_family.value=state.fieldMode;f.u_iterations.value=state.iterations;
  f.u_inversion.value=state.inversion;f.u_warp.value=state.warp;f.u_zoom.value=state.zoom;
  f.u_glitch.value=state.glitch;
  const m=meshMaterial.uniforms;
  m.u_mode.value=state.meshMode;m.u_material.value=state.material;m.u_porosity.value=state.porosity;
  m.u_opacity.value=state.opalOpacity;m.u_transmission.value=state.opalTransmission;
  m.u_opalThickness.value=state.opalThickness;m.u_opalGlow.value=state.opalGlow;
  const g=swarmMaterial.uniforms;
  g.u_swarmSize.value=state.swarmSize;g.u_swarmFlow.value=state.swarmFlow;
  mesh.visible=state.layerMesh;swarm.visible=state.layerSwarm;
}
function render(){
  if(!renderer)return;
  useUniforms();
  const needsPost=state.feedback>0.005||state.halftoneMix>0.005||state.dispersion>0.005||Math.abs(state.acidOverdrive-1)>0.005;
  if(!needsPost){
    configureEffects(false);
    renderer.setRenderTarget(null);
    renderBaseScene();
    return;
  }
  ensureRenderTargets();
  configureEffects();
  // PASS ONE: actual 4D tunnel or biomineral field and 3D objects -> offscreen scene target
  renderer.setRenderTarget(sceneRT);
  renderBaseScene();
  // PASS TWO: temporal optical advection from previous frame -> write target
  const f=feedbackMaterial.uniforms;
  f.uCurrentSceneTex.value=sceneRT.texture;
  f.uHistoryTex.value=historyReadRT.texture;
  renderer.setRenderTarget(historyWriteRT);
  renderer.clear(true,true,true);
  renderer.render(feedbackScene,fieldCamera);
  // PASS THREE: print CMYK-V rosette (or transparent-to-source) -> display
  printMaterial.uniforms.uAccumulatedTex.value=historyWriteRT.texture;
  renderer.setRenderTarget(null);
  renderer.clear(true,true,true);
  renderer.render(printScene,fieldCamera);
  [historyReadRT,historyWriteRT]=[historyWriteRT,historyReadRT];
}
function animate(now){
  const dt=clamp((now-lastStamp)/1000,0,.06);lastStamp=now;
  if(!state.paused){
    t+=dt*state.speed;
    if(pointers.size===0)cameraMotion.targetTheta+=dt*state.cameraDrift*.15;
  }
  const k=1-Math.exp(-dt*11);
  cameraMotion.theta+=(cameraMotion.targetTheta-cameraMotion.theta)*k;
  cameraMotion.phi+=(cameraMotion.targetPhi-cameraMotion.phi)*k;
  cameraMotion.radius+=(cameraMotion.targetRadius-cameraMotion.radius)*k;
  cameraMotion.pointerX+=(cameraMotion.targetX-cameraMotion.pointerX)*k;
  cameraMotion.pointerY+=(cameraMotion.targetY-cameraMotion.pointerY)*k;
  // Damp drag injection independently from camera inertia so optical-history
  // curl follows the hand and rolls to a gentle stop after release.
  const gk=1-Math.exp(-dt*16);
  cameraMotion.gestureX+=(cameraMotion.targetGestureX-cameraMotion.gestureX)*gk;
  cameraMotion.gestureY+=(cameraMotion.targetGestureY-cameraMotion.gestureY)*gk;
  cameraMotion.gesturePower+=(cameraMotion.targetGesturePower-cameraMotion.gesturePower)*gk;
  const releaseDamping=Math.exp(-dt*10);
  cameraMotion.targetGestureX*=releaseDamping;
  cameraMotion.targetGestureY*=releaseDamping;
  cameraMotion.targetGesturePower*=releaseDamping;
  cameraMotion.touch+=(cameraMotion.targetTouch-cameraMotion.touch)*(1-Math.exp(-dt*8));
  const ph=cameraMotion.phi;
  camera.position.set(
    cameraMotion.radius*Math.sin(cameraMotion.theta)*Math.cos(ph),
    cameraMotion.radius*Math.sin(ph),
    cameraMotion.radius*Math.cos(cameraMotion.theta)*Math.cos(ph)
  );
  camera.lookAt(0,0,0);
  try{render();}catch(e){setFatal(e);return;}
  frames++;
  if(now-lastFpsStamp>1100){
    fps=Math.round(frames*1000/(now-lastFpsStamp));
    $('fps').textContent=String(fps)+' fps · '+String(Math.round(state.swarmCount))+' glyphs';
    frames=0;lastFpsStamp=now;
  }
  requestAnimationFrame(animate);
}
function outputFile(blob,name){
  const href=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=href;a.download=name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(href),30000);
}
async function capturePng(size='1'){
  if(!renderer)return;
  const nativeSize=size==='1';
  const oldPixelRatio=renderer.getPixelRatio();
  const w0=$('canvasMount').clientWidth,h0=$('canvasMount').clientHeight;
  let w=w0,h=h0;
  if(size==='portrait'){w=1080;h=1920;}
  else if(size==='landscape'){w=1920;h=1080;}
  else if(!nativeSize){w=Number(size);h=Number(size);}
  try{
    if(!nativeSize){
      renderer.setPixelRatio(1);renderer.setSize(w,h,false);
      camera.aspect=w/h;camera.updateProjectionMatrix();
      fieldMaterial.uniforms.u_resolution.value.set(w,h);
    }
    render();
    const blob=await new Promise(resolve=>renderer.domElement.toBlob(resolve,'image/png'));
    if(!blob)throw new Error('PNG capture returned an empty image');
    outputFile(blob,'hyperbolica-'+Date.now()+'.png');
    notify('PNG CAPTURED · '+w+'×'+h);
  }catch(e){notify('PNG ERROR: '+e.message);}
  finally{
    if(!nativeSize){
      renderer.setPixelRatio(oldPixelRatio);
      renderer.setSize(w0,h0,false);resize();render();
    }
  }
}
function exportDNA(){
  return JSON.stringify({schema:'hyperbolica-dna/v1',version:1,state:copy(state),editedColors:editedColors?[...editedColors]:null},null,2);
}
async function copyDNA(){
  const dna=exportDNA();
  try{await navigator.clipboard.writeText(dna);notify('ART DNA COPIED');}
  catch{window.prompt('Copy this art DNA:',dna);}
}
function loadDNA(dna){
  if(!dna||dna.schema!=='hyperbolica-dna/v1'||!dna.state)throw new Error('Not a Hyperbolica DNA JSON file');
  for(const [key,val] of Object.entries(dna.state)){
    if(Object.hasOwn(defaultState,key)&&typeof val===typeof defaultState[key])state[key]=val;
  }
  state.fieldMode=clamp(Math.round(state.fieldMode),0,FIELD_FAMILIES.length-1);
  state.meshMode=clamp(Math.round(state.meshMode),0,MESH_FAMILIES.length-1);
  state.swarmCount=clamp(state.swarmCount,0,MAX_SPRITES);
  state.quality=clamp(state.quality,.8,2.5);
  if(!paletteList.some(p=>p.id===state.paletteId))state.paletteId=defaultState.paletteId;
  editedColors=(Array.isArray(dna.editedColors)&&dna.editedColors.length===getPalette().colors.length&&dna.editedColors.every(c=>/^#[0-9a-fA-F]{6}$/.test(c)))?[...dna.editedColors]:null;
  pickPalette(state.paletteId,false);syncControls();resize();notify('ART DNA LOADED');
}
function availableFormat(){
  if(!window.MediaRecorder||!renderer.domElement.captureStream)return null;
  for(const type of ['video/mp4;codecs=avc1.42E01E','video/mp4','video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm']){
    if(MediaRecorder.isTypeSupported(type))return type;
  }
  return null;
}
function endRecording(cancel=false){
  if(!recorder||recorder.state==='inactive')return;
  discardRecording=cancel;clearTimeout(recordTimer);
  recorder.stop();
}
function recordClip(){
  const fmt=availableFormat();
  if(!fmt){notify('VIDEO RECORDING NOT SUPPORTED IN THIS BROWSER');return;}
  const secs=Number($('duration').value);
  const stream=renderer.domElement.captureStream(30);
  const chunks=[];
  try{
    recorder=new MediaRecorder(stream,{mimeType:fmt,videoBitsPerSecond:16000000});
    discardRecording=false;
    recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};
    recorder.onstop=()=>{
      stream.getTracks().forEach(track=>track.stop());
      if(!discardRecording&&chunks.length){
        const extension=fmt.includes('mp4')?'mp4':'webm';
        outputFile(new Blob(chunks,{type:fmt}),'hyperbolica-'+secs+'s-'+Date.now()+'.'+extension);
        notify(extension.toUpperCase()+' CLIP SAVED');
      }
      $('record').disabled=false;$('cancelRecord').disabled=true;
      recorder=null;
    };
    recorder.onerror=e=>{notify('RECORDING FAILURE');console.error(e);};
    state.paused=false;syncPause();
    recorder.start(500);
    $('record').disabled=true;$('cancelRecord').disabled=false;
    notify('RECORDING '+secs+'S '+fmt.split(';')[0].toUpperCase());
    recordTimer=setTimeout(()=>endRecording(false),secs*1000);
  }catch(e){
    stream.getTracks().forEach(track=>track.stop());
    recorder=null;notify('VIDEO ERROR: '+e.message);
  }
}
function syncPause(){
  $('pause').textContent=state.paused?'PLAY':'PAUSE';
  $('freezeField').textContent=state.paused?'RESUME TIME':'FREEZE TIME';
}
function togglePause(){state.paused=!state.paused;syncPause();notify(state.paused?'TIME FROZEN':'MATHEMATICAL TIME RUNNING');}
function favoriteSave(){
  try{localStorage.setItem('hyperbolica-favorite',exportDNA());notify('FAVORITE SAVED LOCALLY');}
  catch(e){notify('LOCAL STORAGE UNAVAILABLE');}
}
function favoriteLoad(){
  try{
    const val=localStorage.getItem('hyperbolica-favorite');
    if(!val){notify('NO SAVED FAVORITE YET');return;}
    loadDNA(JSON.parse(val));
  }catch(e){notify('COULD NOT LOAD FAVORITE');}
}
function installUI(){
  fillSelections();makeSliders();
  const tabs=[...document.querySelectorAll('#tabs button')];
  tabs.forEach(b=>b.addEventListener('click',()=>{
    tabs.forEach(x=>x.classList.toggle('selected',x===b));
    document.querySelectorAll('section[data-page]').forEach(section=>section.hidden=section.dataset.page!==b.dataset.tab);
  }));
  $('togglePanel').addEventListener('click',()=>{
    const closed=$('panel').classList.toggle('collapsed');
    $('togglePanel').textContent=closed?'SHOW PANEL':'HIDE PANEL';
    $('gestureHint').textContent=closed?'DRAG: ORBIT + SCULPT · PINCH: ZOOM':'DRAG: ORBIT + WARP · PINCH: ZOOM';
  });
  $('fieldMode').addEventListener('change',e=>{state.fieldMode=Number(e.target.value);notify(FIELD_FAMILIES[state.fieldMode]);});
  $('meshMode').addEventListener('change',e=>{state.meshMode=Number(e.target.value);notify(MESH_FAMILIES[state.meshMode]);});
  $('materialMode').addEventListener('change',e=>state.material=Number(e.target.value));
  $('gestureMode').addEventListener('change',e=>state.gestureMode=e.target.value);
  const chooseRenderMode=value=>{
    state.renderMode=value;
    $('renderMode').value=value;
    $('renderModeCathedral').value=value;
    clearTrails();
    notify(value==='cathedral'?'FLYING 4D CATHEDRAL':value==='hybrid'?'4D CATHEDRAL + BIOMINERAL HYBRID':'ORIGINAL MATHEMATICAL FIELD');
  };
  $('renderMode').addEventListener('change',e=>chooseRenderMode(e.target.value));
  $('renderModeCathedral').addEventListener('change',e=>chooseRenderMode(e.target.value));
  $('inkMode').addEventListener('change',e=>state.paletteInkMix=Number(e.target.value));
  $('clearTrails').addEventListener('click',()=>{clearTrails();notify('CURL HISTORY CLEARED');});
  $('trailOff').addEventListener('click',()=>{state.feedback=0;syncControls();clearTrails();notify('CURL TRAILS DISABLED');});
  $('printOff').addEventListener('click',()=>{state.halftoneMix=0;state.dispersion=0;state.acidOverdrive=1;syncControls();notify('SCREEN PRINT + DISPERSION DISABLED');});
  $('soloCathedral').addEventListener('click',()=>{
    chooseRenderMode('cathedral');state.layerBg=true;state.layerMesh=false;state.layerSwarm=false;syncControls();
  });
  $('cathedralSwarm').addEventListener('click',()=>{
    chooseRenderMode('cathedral');state.layerBg=true;state.layerMesh=false;state.layerSwarm=true;syncControls();
  });
  $('cathedralEverything').addEventListener('click',()=>{
    chooseRenderMode('hybrid');state.layerBg=true;state.layerMesh=true;state.layerSwarm=true;syncControls();
  });
  $('paletteSource').addEventListener('change',refreshPaletteOptions);
  $('paletteSelect').addEventListener('change',e=>pickPalette(e.target.value,true,true));
  $('shufflePalette').addEventListener('click',shufflePalette);
  $('shuffleStops').addEventListener('click',shuffleStops);
  $('resetStops').addEventListener('click',()=>{editedColors=null;updatePaletteTexture();notify('ORIGINAL PALETTE RESTORED');});
  $('newDesign').addEventListener('click',()=>{if(confirm('Discard this artwork and make a brand new mathematical creature?')){state.seed=(Math.random()*4294967296)>>>0;mutate(false);shufflePalette();}});
  $('mutate').addEventListener('click',()=>mutate(false));
  $('mutateStructure').addEventListener('click',()=>mutate(true));
  $('surprise').addEventListener('click',()=>{mutate(false);shufflePalette();});
  $('applyPreset').addEventListener('click',()=>applyPreset(Number($('presetSelect').value)));
  $('presetSelect').addEventListener('change',e=>{$('presetInfo').textContent=PRESETS[Number(e.target.value)].detail;});
  const wireLayer=(id,key)=>{
    $(id).addEventListener('click',()=>{state[key]=!state[key];syncControls();notify(key.toUpperCase()+': '+(state[key]?'ON':'OFF'));});
  };
  wireLayer('bgToggle','layerBg');wireLayer('meshToggle','layerMesh');wireLayer('swarmToggle','layerSwarm');
  $('soloField').addEventListener('click',()=>{state.layerBg=true;state.layerMesh=false;state.layerSwarm=false;syncControls();});
  $('soloMesh').addEventListener('click',()=>{state.layerBg=false;state.layerMesh=true;state.layerSwarm=false;syncControls();});
  $('allLayers').addEventListener('click',()=>{state.layerBg=true;state.layerMesh=true;state.layerSwarm=true;syncControls();});
  $('resetView').addEventListener('click',resetView);
  $('pause').addEventListener('click',togglePause);
  $('freezeField').addEventListener('click',togglePause);
  $('savePng').addEventListener('click',()=>capturePng('1'));
  $('exportPng').addEventListener('click',()=>capturePng($('pngSize').value));
  $('copyDNA').addEventListener('click',copyDNA);
  $('importDNA').addEventListener('click',()=>$('importDialog').showModal());
  $('closeImport').addEventListener('click',()=>$('importDialog').close());
  $('confirmImport').addEventListener('click',()=>{
    try{loadDNA(JSON.parse($('dnaInput').value));$('importDialog').close();}
    catch(e){notify('DNA ERROR: '+e.message);}
  });
  $('record').addEventListener('click',recordClip);
  $('cancelRecord').addEventListener('click',()=>endRecording(true));
  $('saveFavorite').addEventListener('click',favoriteSave);
  $('loadFavorite').addEventListener('click',favoriteLoad);
  $('retry').addEventListener('click',()=>location.reload());
  window.addEventListener('keydown',e=>{
    if(e.target.closest('input,select,textarea,dialog'))return;
    if(e.code==='Space'){e.preventDefault();togglePause();}
    if(e.key.toLowerCase()==='h')$('togglePanel').click();
    if(e.key.toLowerCase()==='m')mutate(false);
    if(e.key.toLowerCase()==='c'){clearTrails();notify('CURL TRAILS CLEARED');}
    if(e.key==='Escape'&&$('importDialog').open)$('importDialog').close();
  });
  $('presetInfo').textContent=PRESETS[0].detail;
  syncControls();syncPause();
}
function start(){
  try{
    installUI();initRenderer();
    const heroIndex=PRESETS.findIndex(p=>p.name.includes('OPAL CATHEDRAL MEMORY GARDEN'));
    applyPreset(heroIndex>=0?heroIndex:0);
    requestAnimationFrame(animate);
  }catch(e){console.error('Hyperbolica startup failure',e);setFatal(e);}
}
start();
