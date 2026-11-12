precision highp float;
varying vec3 vWorldPosition,vNormal;
varying vec2 vParam;
varying float vStress,vDisplacement;
uniform float u_time,u_symmetry,u_iridescence,u_saturation,u_material,u_porosity,u_moire,u_phase;
uniform sampler2D u_palette;
#define TAU 6.283185307179586
vec3 pal(float t){return texture2D(u_palette,vec2(fract(t+u_phase),0.5)).rgb;}
void main(){
  vec3 N=normalize(vNormal);
  if(!gl_FrontFacing)N=-N;
  vec3 V=normalize(cameraPosition-vWorldPosition);
  float ndv=max(dot(N,V),0.0);
  float fres=pow(1.0-ndv,2.6);
  float u=vParam.x,v=vParam.y;
  float sym=floor(u_symmetry+0.5);
  float lattice=sin(u*sym*2.0+v*sym)*cos(v*sym*2.0-u*sym);
  float pore=abs(lattice);
  float body=smoothstep(0.04,0.24,pore);
  if(u_porosity>0.7 && body<(u_porosity-0.7)*0.85)discard;
  float rib=0.5+0.5*sin((u+v)*u_moire*28.0-u_time*1.2);
  float phase=(vStress*0.6+vDisplacement*0.9+(1.0-ndv)*1.9+rib*0.15)*u_iridescence*0.34-u_time*0.09;
  vec3 c0=pal(phase+0.045),c1=pal(phase),c2=pal(phase-0.045);
  vec3 film=vec3(c0.r,c1.g,c2.b);
  vec3 subsurface=pal(phase+0.47);
  vec3 color=mix(subsurface*1.1,film,body);
  vec3 L1=normalize(vec3(sin(u_time*0.6),0.8,cos(u_time*0.4)));
  vec3 L2=normalize(vec3(-0.6,cos(u_time*0.3),0.5));
  float diff=max(dot(N,L1),0.0)*0.7+max(dot(N,L2),0.0)*0.35;
  vec3 H=normalize(V+L1),H2=normalize(V+L2);
  float gloss=(u_material<0.5?60.0:u_material<1.5?18.0:u_material<2.5?110.0:u_material<3.5?38.0:80.0);
  float spec=pow(max(dot(N,H),0.0),gloss);
  float spec2=pow(max(dot(N,H2),0.0),26.0);
  if(u_material>1.5&&u_material<2.5){ // metallic
    color=mix(color,pal(phase+0.18),0.45);
  }else if(u_material>2.5&&u_material<3.5){ // satin
    color=mix(color,vec3(dot(color,vec3(0.299,0.587,0.114))),0.1);
  }else if(u_material>3.5){ // opal wet glass
    color=mix(color,vec3(0.83,0.91,1.0),0.16+fres*0.20);
  }
  color*=0.30+0.78*diff;
  color+=spec*1.5*vec3(1.0,0.97,0.94);
  color+=spec2*0.6*pal(phase+0.24);
  color+=pal(phase+0.57)*fres*(u_material>3.5?2.4:1.65);
  color+=subsurface*(1.0-body)*0.42;
  float luma=dot(color,vec3(0.299,0.587,0.114));
  color=mix(vec3(luma),color,u_saturation);
  color=vec3(1.0)-exp(-max(color,vec3(0.0))*(0.9+u_saturation*0.14));
  gl_FragColor=vec4(color,1.0);
}
