import { fieldVertex,fieldFragment,ribbonVertex,ribbonFragment,defectVertex,defectFragment } from './shaders.js';

function compile(gl,type,source){
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(error);}
  return shader;
}
function program(gl,vertex,fragment,attributes,uniforms){
  const precision=gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER,gl.HIGH_FLOAT);
  const vs=compile(gl,gl.VERTEX_SHADER,vertex),fs=compile(gl,gl.FRAGMENT_SHADER,precision?.precision?fragment:fragment.replace('precision highp float;','precision mediump float;'));
  const handle=gl.createProgram();gl.attachShader(handle,vs);gl.attachShader(handle,fs);gl.linkProgram(handle);gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(handle,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(handle));
  return {handle,attributes:Object.fromEntries(attributes.map(k=>[k,gl.getAttribLocation(handle,k)])),uniforms:Object.fromEntries(uniforms.map(k=>[k,gl.getUniformLocation(handle,k)]))};
}
function texture(gl,unit){
  const handle=gl.createTexture();gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,handle);
  for(const wrap of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,wrap,gl.CLAMP_TO_EDGE);
  for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,filter,gl.LINEAR);
  return handle;
}
export function paletteBytes(colors){
  const stops=colors.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))),data=new Uint8Array(1024);
  for(let i=0;i<256;i++){
    const p=i/255*(stops.length-1),a=Math.floor(p),b=Math.min(stops.length-1,a+1),f=p-a;
    for(let k=0;k<3;k++)data[i*4+k]=Math.round(stops[a][k]*(1-f)+stops[b][k]*f);data[i*4+3]=255;
  }
  return data;
}
function patchFor(width,height){
  // One material square remains square on both a portrait phone and a desktop.
  const side=Math.max(1,Math.min(width*.92,height*.81));
  return [(width-side)/2,(height-side)/2,side,side];
}
function materialPointer(canvas,u,v){
  const rect=canvas.getBoundingClientRect(),patch=patchFor(rect.width,rect.height);
  const x=(u*rect.width-patch[0])/patch[2],y=((1-v)*rect.height-patch[1])/patch[3];
  return x>=0&&x<=1&&y>=0&&y<=1?[x,y]:null;
}

export class SilkRenderer {
  constructor(canvas){
    this.canvas=canvas;const gl=this.gl=canvas.getContext('webgl',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'low-power'});
    if(!gl)throw new Error('WebGL unavailable');
    const common=['uState','uPalette','uResolution','uPatch','uPolarizer','uSource','uView','uGrid'];
    this.field=program(gl,fieldVertex,fieldFragment,['aPosition'],common);
    this.ribbon=program(gl,ribbonVertex,ribbonFragment,['aPosition','aNormal','aSide','aTension','aPigment','aArc','aWidth'],common);
    this.defect=program(gl,defectVertex,defectFragment,['aPosition','aCharge'],['uResolution','uPatch']);
    this.screen=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.screen);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    this.ribbons=gl.createBuffer();this.defects=gl.createBuffer();
    this.state=texture(gl,0);this.palette=texture(gl,1);this.allocated=0;
    this.vertices=new Float32Array(60000*9);this.defectData=new Float32Array(256*3);
    this.backend='WebGL silk';
    this.setPalette(['#142437','#596dd6','#ef75bc','#f0dca1','#8debc8']);
  }
  setPalette(colors){
    this.paletteData=paletteBytes(colors);const gl=this.gl;
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.palette);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,256,1,0,gl.RGBA,gl.UNSIGNED_BYTE,this.paletteData);
  }
  use(p,settings,patch){
    const gl=this.gl,u=p.uniforms;gl.useProgram(p.handle);
    gl.uniform2f(u.uResolution,this.canvas.width,this.canvas.height);gl.uniform4f(u.uPatch,...patch);
    if(u.uState!==undefined)gl.uniform1i(u.uState,0);
    if(u.uPalette!==undefined)gl.uniform1i(u.uPalette,1);
    if(u.uPolarizer!==undefined)gl.uniform1f(u.uPolarizer,(settings.polarizer||0)*Math.PI/180);
    if(u.uSource!==undefined)gl.uniform1f(u.uSource,settings.source?1:0);
    if(u.uView!==undefined)gl.uniform1f(u.uView,settings.view||0);
    // Attribute arrays from another program must be disabled before reusing a buffer.
    const limit=gl.getParameter(gl.MAX_VERTEX_ATTRIBS);for(let i=0;i<limit;i++)gl.disableVertexAttribArray(i);
  }
  attribute(p,key,size,stride,offset){
    const location=p.attributes[key];if(location<0)return;
    const gl=this.gl;gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,stride*4,offset*4);
  }
  draw(sim,bytes,settings){
    const {canvas,gl}=this,rect=canvas.getBoundingClientRect();
    const cap=settings.quality<=72?260000:settings.quality<=104?500000:850000;
    const ratio=Math.min(globalThis.devicePixelRatio||1,Math.sqrt(cap/Math.max(1,rect.width*rect.height)));
    const w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    const patch=patchFor(w,h);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.state);
    if(this.allocated!==sim.size){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,sim.size,sim.size,0,gl.RGBA,gl.UNSIGNED_BYTE,bytes);this.allocated=sim.size;}
    else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,sim.size,sim.size,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.palette);
    gl.disable(gl.BLEND);this.use(this.field,settings,patch);gl.uniform1f(this.field.uniforms.uGrid,sim.size);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.screen);this.attribute(this.field,'aPosition',2,2,0);gl.drawArrays(gl.TRIANGLES,0,6);
    const count=this.buildRibbons(sim,patch[2]);
    if(count){
      this.use(this.ribbon,settings,patch);gl.bindBuffer(gl.ARRAY_BUFFER,this.ribbons);
      gl.bufferData(gl.ARRAY_BUFFER,this.vertices.subarray(0,count*9),gl.DYNAMIC_DRAW);
      for(const [key,size,offset]of [['aPosition',2,0],['aNormal',2,2],['aSide',1,4],['aTension',1,5],['aPigment',1,6],['aArc',1,7],['aWidth',1,8]])this.attribute(this.ribbon,key,size,9,offset);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.TRIANGLES,0,count);
    }
    if(settings.view===1&&sim.defects?.length){
      const n=Math.min(256,sim.defects.length);
      for(let i=0;i<n;i++){const d=sim.defects[i];this.defectData.set([d.x,d.y,d.charge],i*3);}
      this.use(this.defect,settings,patch);gl.bindBuffer(gl.ARRAY_BUFFER,this.defects);gl.bufferData(gl.ARRAY_BUFFER,this.defectData.subarray(0,n*3),gl.DYNAMIC_DRAW);
      this.attribute(this.defect,'aPosition',2,3,0);this.attribute(this.defect,'aCharge',1,3,2);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.drawArrays(gl.POINTS,0,n);
    }
    gl.disable(gl.BLEND);
  }
  buildRibbons(sim,side){
    const fibers=sim.fibers||[];let segments=0;
    for(const f of fibers)segments+=Math.max(0,f.points.length-1);
    const maximum=segments*6*9;if(maximum>this.vertices.length)this.vertices=new Float32Array(maximum);
    let at=0;
    const normal=(points,i)=>{
      const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];let dx=b.x-a.x,dy=b.y-a.y;
      // Tangents use the shortest periodic displacement even though the seam
      // segment itself is omitted, avoiding a reversed miter beside the seam.
      dx-=Math.round(dx);dy-=Math.round(dy);
      const length=Math.hypot(dx,dy)||1;return [-dy/length,dx/length];
    };
    for(const fiber of fibers){
      const points=fiber.points,pigment=((fiber.id||0)*.61803398875)%1;
      const width=Math.max(1.35,side*(.0032+((fiber.id||0)%7)*.00027));let arc=0;
      for(let i=1;i<points.length;i++){
        const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.y-a.y);
        if(Math.abs(b.x-a.x)>.5||Math.abs(b.y-a.y)>.5||length<1e-7)continue;
        const na=normal(points,i-1),nb=normal(points,i),next=arc+length;
        const emit=(p,n,sign,s)=>{const tension=Math.max(0,Math.min(1,Number.isFinite(p.tension)?p.tension:0));this.vertices.set([p.x,p.y,n[0],n[1],sign,tension,pigment,s,width*(1+tension*.45)],at);at+=9;};
        emit(a,na,-1,arc);emit(a,na,1,arc);emit(b,nb,-1,next);
        emit(b,nb,-1,next);emit(a,na,1,arc);emit(b,nb,1,next);arc=next;
      }
    }
    return at/9;
  }
  pointer(u,v){return materialPointer(this.canvas,u,v);}
}

export class FlatSilkRenderer {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw new Error('Canvas 2D unavailable');this.backend='Canvas silk fallback';this.map=document.createElement('canvas');this.mapContext=this.map.getContext('2d');this.setPalette(['#1c3550','#8fe8ca','#f079b2','#ecdfb5']);}
  setPalette(colors){this.paletteData=paletteBytes(colors);}
  draw(sim,bytes,settings){
    const canvas=this.canvas,rect=canvas.getBoundingClientRect(),ratio=Math.min(1,Math.sqrt(400000/Math.max(1,rect.width*rect.height)));
    canvas.width=Math.max(1,Math.round(rect.width*ratio));canvas.height=Math.max(1,Math.round(rect.height*ratio));
    const ctx=this.ctx,patch=patchFor(canvas.width,canvas.height),[ox,oy,side]=patch,n=sim.size;
    ctx.fillStyle='#070c13';ctx.fillRect(0,0,canvas.width,canvas.height);
    if(this.map.width!==n){this.map.width=n;this.map.height=n;}
    const image=this.mapContext.createImageData(n,n),polarizer=(settings.polarizer||0)*Math.PI/180;
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const i=(y*n+x)*4,k=((n-1-y)*n+x)*4,q1=bytes[k]/255*3-1.5,q2=bytes[k+1]/255*3-1.5;
      const theta=.5*Math.atan2(q2,q1),crossed=Math.sin(2*(theta-polarizer))**2,stress=bytes[k+2]/255;
      const p=Math.floor((((theta/Math.PI+.55+stress*.22)%1+1)%1)*255)*4;
      for(let c=0;c<3;c++)image.data[i+c]=settings.view===2?[10+stress*240,22+stress*130,32+stress*40][c]:8+this.paletteData[p+c]*crossed*(settings.view===1?.45:.11);
      image.data[i+3]=255;
    }
    this.mapContext.putImageData(image,0,0);ctx.drawImage(this.map,ox,oy,side,side);
    ctx.lineCap='round';ctx.lineJoin='round';
    for(const fiber of sim.fibers||[]){
      const points=fiber.points;if(points.length<2)continue;
      for(let i=1;i<points.length;i++){
        const a=points[i-1],b=points[i];if(Math.abs(a.x-b.x)>.5||Math.abs(a.y-b.y)>.5)continue;
        const tension=Math.max(0,Math.min(1,b.tension||0)),p=Math.floor((((fiber.id||0)*.61803398875+tension*.48)%1)*255)*4;
        ctx.strokeStyle=`rgba(${this.paletteData[p]},${this.paletteData[p+1]},${this.paletteData[p+2]},${settings.view===1?.28:.87})`;ctx.lineWidth=Math.max(1.5,side*.0064);
        ctx.beginPath();ctx.moveTo(ox+a.x*side,oy+(1-a.y)*side);ctx.lineTo(ox+b.x*side,oy+(1-b.y)*side);ctx.stroke();
      }
    }
    if(settings.view===1)for(const d of sim.defects||[]){ctx.strokeStyle=d.charge>0?'#ffac78':'#7ccaff';ctx.lineWidth=1;ctx.beginPath();ctx.arc(ox+d.x*side,oy+(1-d.y)*side,5,0,Math.PI*2);ctx.stroke();}
  }
  pointer(u,v){return materialPointer(this.canvas,u,v);}
}
