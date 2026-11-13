import { SpinodalSimulation, DEFAULT_PARAMS } from './simulation.js';
import { MineralRenderer, FlatRenderer } from './renderer.js';

const $=id=>document.getElementById(id);
const mobile=matchMedia('(max-width:800px), (pointer:coarse)').matches;
const query=new URLSearchParams(location.search);
const sourceColors=['#090f24','#5334ab','#ec56b2','#ffb06b','#c3f6a3','#54dbd1','#607def','#d8b9f3'];
const palettes=new Map([['source',sourceColors]]);
const params={...DEFAULT_PARAMS};
const settings={quality:mobile?112:176,speed:1,cut:-.18,film:1,source:true,view:0};
if([112,176,256].includes(Number(query.get('quality'))))settings.quality=Number(query.get('quality'));
let canvas=$('art'),renderer,sim,bytes,paused=matchMedia('(prefers-reduced-motion:reduce)').matches,busy=false,lost=false,canvasEvents;
let last=performance.now(),debt=0,frames=0,statStamp=last,fps=0,dirty=true,pointer=null;
const controls=[
  ['quench','Quench depth',.55,1.5,.01,'How strongly the two phases separate.'],
  ['anisotropy','Transport anisotropy',0,.8,.01,'Bias the direction in which domains rearrange.'],
  ['mineralRate','Mineral accretion',0,.18,.002,'Deposit glass; arrest moving interfaces.'],
  ['feed','Nutrient supply',0,.20,.005,'Replenish the reagent consumed by mineral.'],
  ['dissolve','Dissolution',0,.12,.002,'Release arrested material; preserve its history.'],
  ['speed','Evolution speed',0,3,.05,'Independent rate of fixed simulation steps.'],
];
for(const [key,title,min,max,step,hint] of controls){
  const target=key==='speed'?settings:params,fromQuery=Number(query.get(key));
  if(query.has(key)&&Number.isFinite(fromQuery))target[key]=Math.max(min,Math.min(max,fromQuery));
  const el=document.createElement('div');el.className='control';
  el.innerHTML=`<label for="${key}">${title}<output id="out-${key}"></output></label><input id="${key}" type="range" min="${min}" max="${max}" step="${step}"><small>${hint}</small>`;
  $('sliders').append(el);$(key).value=target[key];
  $(key).addEventListener('input',()=>{target[key]=Number($(key).value);syncOutputs();remember();});
}
function syncOutputs(){for(const [key]of controls)$('out-'+key).value=(key==='speed'?settings[key]:params[key]).toFixed(key==='mineralRate'||key==='dissolve'?3:2);}
function remember(){
  const q=new URLSearchParams({seed:$('seed').value,quality:String(settings.quality),palette:$('palette').value});
  for(const [key]of controls)q.set(key,String(key==='speed'?settings[key]:params[key]));
  history.replaceState(null,'',`${location.pathname}?${q}`);
}
function createRenderer(){
  canvasEvents?.abort();canvasEvents=new AbortController();
  try{if(query.has('flat'))throw new Error('Reduced map requested');renderer=new MineralRenderer(canvas);}
  catch(error){
    if(!query.has('flat'))console.warn('Relief unavailable; using the same simulation in Canvas 2D.',error.message);
    const next=canvas.cloneNode();canvas.replaceWith(next);canvas=next;
    renderer=new FlatRenderer(canvas);
  }
  renderer.setPalette(palettes.get($('palette').value)||sourceColors);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();lost=true;$('status').textContent='Graphics context lost. Waiting for restoration…';},{signal:canvasEvents.signal});
  canvas.addEventListener('webglcontextrestored',()=>{lost=false;createRenderer();dirty=true;},{signal:canvasEvents.signal});
  bindPointer();
}
function bindPointer(){
  const options={signal:canvasEvents.signal};
  canvas.addEventListener('pointerdown',event=>{if(busy)return;canvas.setPointerCapture(event.pointerId);pointer={id:event.pointerId,x:event.clientX,y:event.clientY};paint();},options);
  canvas.addEventListener('pointermove',event=>{if(pointer?.id!==event.pointerId)return;pointer.x=event.clientX;pointer.y=event.clientY;paint();},options);
  const release=()=>pointer=null;
  canvas.addEventListener('pointerup',release,options);canvas.addEventListener('pointercancel',release,options);canvas.addEventListener('lostpointercapture',release,options);
}
function paint(){
  if(!pointer||!sim||busy||lost)return;
  const rect=canvas.getBoundingClientRect(),uv=renderer.pointer((pointer.x-rect.left)/rect.width,(pointer.y-rect.top)/rect.height,settings.view);
  if(uv){sim.inject(...uv,$('brush').value);dirty=true;}
}
function status(){
  if(!sim||lost||busy)return;
  $('status').textContent=`${paused?'Paused':settings.speed===0?'Speed zero':'Evolving'} · ${renderer.backend} · drag to ${$('brush').value==='quench'?'disturb':$('brush').value}`;
}
async function regrow(seed){
  if(busy)return;busy=true;pointer=null;
  $('status').textContent='Separating the warm-start mixture…';
  for(const id of ['mutate','reseed','quality','seed',...controls.map(c=>c[0])])$(id).disabled=true;
  // Let the browser paint the preparation state before the deterministic warm start.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
  try{
    const numeric=Number(seed);seed=Number.isFinite(numeric)?numeric>>>0:761235;$('seed').value=seed;
    sim=new SpinodalSimulation(settings.quality,seed,params,{warmupSteps:0});
    // Keep the same parameter object so live sliders change the actual operator.
    sim.params=params;bytes=new Uint8Array(sim.size*sim.size*4);
    // The same deterministic preconditioning as the synchronous API, in small
    // batches so Safari can paint, scroll and respond while a specimen regrows.
    let warm=0;
    while(warm<600){
      const start=performance.now();
      do{sim.advance(.025,false);warm++;}while(warm<600&&performance.now()-start<10);
      $('status').textContent=`Separating the mixture · ${Math.round(warm/6)}%`;
      await new Promise(resolve=>requestAnimationFrame(resolve));
    }
    dirty=true;debt=0;last=performance.now();remember();
  }catch(error){$('status').textContent=`Unable to initialize: ${error.message}`;console.error(error);}
  finally{busy=false;for(const id of ['mutate','reseed','quality','seed',...controls.map(c=>c[0])])$(id).disabled=false;status();}
}
$('pause').addEventListener('click',()=>{paused=!paused;$('pause').textContent=paused?'Resume':'Pause';$('pause').setAttribute('aria-pressed',String(paused));debt=0;status();});
$('pause').textContent=paused?'Resume':'Pause';$('pause').setAttribute('aria-pressed',String(paused));
$('reseed').addEventListener('click',()=>regrow($('seed').value));
$('seed').addEventListener('keydown',event=>{if(event.key==='Enter')regrow($('seed').value);});
$('mutate').addEventListener('click',()=>{
  const random=new Uint32Array(5);crypto.getRandomValues(random);const r=i=>random[i]/4294967296;
  params.quench=.78+r(1)*.50;params.anisotropy=r(2)*.76;params.mineralRate=.012+r(3)*.09;params.feed=.01+r(4)*.11;params.dissolve=0;
  for(const [key]of controls)$(key).value=key==='speed'?settings[key]:params[key];syncOutputs();regrow(random[0]);
});
$('quality').value=settings.quality;
$('quality').addEventListener('change',()=>{settings.quality=Number($('quality').value);regrow($('seed').value);});
$('view').addEventListener('change',()=>{settings.view=Number($('view').value);dirty=true;});
$('brush').addEventListener('change',status);
$('palette').addEventListener('change',()=>{renderer.setPalette(palettes.get($('palette').value)||sourceColors);settings.source=$('palette').value==='source';dirty=true;remember();});
$('snapshot').addEventListener('click',()=>{
  if(!sim||lost)return;
  renderer.draw(sim,sim.encode(bytes),settings);
  canvas.toBlob(blob=>{
    if(!blob){$('status').textContent='PNG export unavailable in this browser.';return;}
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;
    a.download=`argon-spinodal-${sim.seed}-${sim.steps}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  },'image/png');
});
document.addEventListener('keydown',event=>{if(event.code==='Space'&&!/INPUT|SELECT|BUTTON|SUMMARY/.test(document.activeElement.tagName)){event.preventDefault();$('pause').click();}});
document.addEventListener('visibilitychange',()=>{last=performance.now();debt=0;});
window.addEventListener('resize',()=>dirty=true);

async function loadPalettes(){
  try{
    const response=await fetch(new URL('../../data/mathemagical-palettes.json',import.meta.url));
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const library=await response.json();
    for(const p of library.palettes){palettes.set(p.id,p.colors);const option=document.createElement('option');option.value=p.id;option.textContent=p.name+' · '+p.id;$('palette').append(option);}
    const desired=query.get('palette');
    if(desired&&palettes.has(desired)){$('palette').value=desired;settings.source=desired==='source';renderer.setPalette(palettes.get(desired));dirty=true;}
  }catch(error){console.warn('Shared palette library unavailable; source colors remain available.',error.message);}
}
function frame(now){
  requestAnimationFrame(frame);
  const elapsed=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
  if(!sim||busy||lost||document.hidden)return;
  if(!paused&&settings.speed>0){
    debt=Math.min(5,debt+elapsed*48*settings.speed);
    const start=performance.now();let count=0;
    while(debt>=1&&performance.now()-start<12){sim.step(1);debt--;count++;}
    if(count)dirty=true;
  }
  if(dirty){renderer.draw(sim,sim.encode(bytes),settings);dirty=false;}
  frames++;
  if(now-statStamp>750){
    fps=Math.round(frames*1000/(now-statStamp));frames=0;statStamp=now;const s=sim.stats();
    $('age').textContent=`${s.time.toFixed(1)} τ`;
    $('metrics').textContent=`${Math.round(s.phaseFraction*100)}% PHASE · ${Math.round(s.mineralFraction*100)}% MINERAL · ${fps} FPS`;
    status();
  }
}
syncOutputs();
try{createRenderer();loadPalettes();requestAnimationFrame(frame);regrow(query.get('seed')??761235);}
catch(error){$('status').textContent=`Browser graphics unavailable: ${error.message}`;console.error(error);}

// Explicit opt-in read-only diagnostics for reproducible browser QA, no live arrays.
if(query.has('diagnostics'))Object.defineProperty(window,'argon',{value:{stats:()=>sim?.stats(),settings:()=>({...settings,paused}),backend:()=>renderer?.backend}});
