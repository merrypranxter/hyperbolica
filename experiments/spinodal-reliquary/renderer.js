import { vertex, fragment } from './shaders.js';

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source); gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader); gl.deleteShader(shader); throw new Error(log);
  }
  return shader;
}

export class MineralRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    const gl = this.gl = canvas.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'low-power' });
    if (!gl) throw new Error('WebGL is unavailable');
    const precision = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    const program = this.program = gl.createProgram();
    const vs = compile(gl, gl.VERTEX_SHADER, vertex);
    const fs = compile(gl, gl.FRAGMENT_SHADER, precision?.precision ? fragment : fragment.replace('precision highp float;', 'precision mediump float;'));
    gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    gl.deleteShader(vs); gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const location = gl.getAttribLocation(program, 'aPosition'); gl.enableVertexAttribArray(location); gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    this.locations = Object.fromEntries(['uState','uPalette','uResolution','uGrid','uCut','uFilm','uSource','uView','uSteps'].map(key=>[key,gl.getUniformLocation(program,key)]));
    this.state = this.makeTexture(0); this.paletteTexture = this.makeTexture(1);
    gl.uniform1i(this.locations.uState, 0); gl.uniform1i(this.locations.uPalette, 1);
    this.backend = 'WebGL relief';
    this.allocated = 0;
  }
  makeTexture(unit) {
    const gl = this.gl, texture = gl.createTexture(); gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texture);
    for(const wrap of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,wrap,gl.CLAMP_TO_EDGE);
    for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,filter,gl.LINEAR);
    return texture;
  }
  setPalette(colors) {
    const data = paletteBytes(colors), gl = this.gl;
    gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.paletteTexture);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,256,1,0,gl.RGBA,gl.UNSIGNED_BYTE,data);
    this.colors = colors;
  }
  draw(sim, bytes, settings) {
    const {canvas,gl,locations:l} = this;
    const rect=canvas.getBoundingClientRect(),cap=settings.quality===112?220000:settings.quality===176?420000:900000;
    const ratio=Math.min(devicePixelRatio||1,Math.sqrt(cap/(rect.width*rect.height)));
    const w=Math.max(1,Math.round(rect.width*ratio)),h=Math.max(1,Math.round(rect.height*ratio));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.state);
    if(this.allocated!==sim.size){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,sim.size,sim.size,0,gl.RGBA,gl.UNSIGNED_BYTE,bytes);this.allocated=sim.size;}
    else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,sim.size,sim.size,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
    gl.uniform2f(l.uResolution,w,h);gl.uniform1f(l.uGrid,sim.size);
    gl.uniform1f(l.uCut,settings.cut);gl.uniform1f(l.uFilm,settings.film);
    gl.uniform1f(l.uSource,settings.source?1:0);gl.uniform1f(l.uView,settings.view);
    gl.uniform1f(l.uSteps,settings.quality===112?48:settings.quality===176?72:112);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
  // Invert the orthographic camera onto z=0; rendering depth adds a small offset.
  pointer(u,v,view=0) {
    const rect=this.canvas.getBoundingClientRect(),aspect=rect.width/rect.height,scale=1.58*Math.max(1,1/aspect);
    let x=(u*2-1)*aspect*scale,y=(1-v*2)*scale;
    if(view<.5){
      const ex=.25,ey=-.68,ez=1,len=Math.hypot(ex,ey,ez),E=[ex/len,ey/len,ez/len];
      const rl=Math.hypot(E[2],E[0]),R=[E[2]/rl,0,-E[0]/rl],U=[E[1]*R[2],E[2]*R[0]-E[0]*R[2],-E[1]*R[0]];
      const px=R[0]*x+U[0]*y,py=U[1]*y,pz=R[2]*x+U[2]*y;
      x=px-E[0]*pz/E[2];y=py-E[1]*pz/E[2];
    }
    if(Math.hypot(x,y)>1.37)return null;
    return [x/3+.5,y/3+.5];
  }
}

export function paletteBytes(colors) {
  const stops=colors.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16))),data=new Uint8Array(256*4);
  for(let i=0;i<256;i++){
    const t=i/255*(stops.length-1),a=Math.floor(t),b=Math.min(stops.length-1,a+1),f=t-a;
    for(let j=0;j<3;j++)data[i*4+j]=Math.round(stops[a][j]*(1-f)+stops[b][j]*f);data[i*4+3]=255;
  }
  return data;
}

// Same persistent simulation, reduced to a direct 2D map on unsupported GPUs.
export class FlatRenderer {
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');if(!this.ctx)throw new Error('Canvas unavailable');this.backend='Canvas 2D fallback';}
  setPalette(colors){this.colors=paletteBytes(colors);}
  draw(sim,bytes,settings){
    const n=sim.size;this.canvas.width=n;this.canvas.height=n;
    const image=this.ctx.createImageData(n,n);
    for(let y=0;y<n;y++)for(let x=0;x<n;x++){
      const i=(y*n+x)*4,source=((n-1-y)*n+x)*4,c=bytes[source]/255*3-1.5,s=bytes[source+1]/255,h=bytes[source+3]/255;
      const outside=Math.hypot(x/n-.5,y/n-.5)>1.37/3;
      const idx=Math.min(255,Math.floor(((.12+c*.16+s*.78+h*1.6)%1+1)%1*255))*4;
      for(let k=0;k<3;k++){
        let value=this.colors[idx+k]*(.55+s*.4);
        if(settings.view===1)value=[25+180*(c+1.5)/3,45+180*bytes[source+2]/255,65+170*s][k];
        if(settings.view===2)value=[10+240*h,20+140*h,35+40*h][k];
        image.data[i+k]=outside||(settings.view===0&&c<settings.cut)?10:value;
      }
      image.data[i+3]=255;
    }
    this.ctx.putImageData(image,0,0);
  }
  pointer(u,v){if(Math.hypot(u-.5,v-.5)>1.37/3)return null;return [u,1-v];}
}
