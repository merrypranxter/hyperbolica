export const vertex = `
attribute vec2 aPosition;
varying vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;

// A fixed-step volume intersection, NOT sphere tracing of a certified SDF.
// The implicit solid is an extrusion of the evolving 2D phase field.
export const fragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uState,uPalette;
uniform vec2 uResolution;
uniform float uGrid,uCut,uFilm,uSource,uView,uSteps;
const float PI=3.14159265359;
vec4 state(vec2 p){return texture2D(uState,clamp(p/3.+.5,vec2(.001),vec2(.999)));}
float material(vec3 p){
  vec4 s=state(p.xy);float c=s.r*3.-1.5;
  float height=.038+.036*smoothstep(-.5,.7,c)+.11*s.g+.085*s.a;
  return max(max(abs(p.z)-height,(uCut-c)*.07),length(p.xy)-1.37);
}
vec2 box(vec3 ro,vec3 rd){
  vec3 a=(-vec3(1.4,1.4,.28)-ro)/rd,b=(vec3(1.4,1.4,.28)-ro)/rd;
  vec3 lo=min(a,b),hi=max(a,b);
  return vec2(max(max(lo.x,lo.y),lo.z),min(min(hi.x,hi.y),hi.z));
}
vec3 spectrum(float optical,float cosine){
  vec3 wavelength=vec3(650.,510.,440.);
  return .5+.5*cos(4.*PI*1.46*optical*cosine/wavelength+vec3(.2,.5,.8));
}
void main(){
  vec2 screen=vUv*2.-1.;screen.x*=uResolution.x/uResolution.y;
  vec3 eye=normalize(vec3(.25,-.68,1.)),right=normalize(cross(vec3(0.,1.,0.),eye)),up=cross(eye,right);
  float scale=1.58*max(1.,uResolution.y/uResolution.x);
  vec3 ro=eye*4.+scale*(right*screen.x+up*screen.y),rd=-eye;
  vec3 bg=mix(vec3(.018,.029,.040),vec3(.042,.063,.074),clamp(1.-length(screen)*.45,0.,1.));
  if(uView>.5){
    vec2 q=screen*scale;vec4 s=state(q);float c=s.r*3.-1.5;
    vec3 col=uView<1.5?mix(vec3(.08,.14,.23),vec3(.82,.94,.7),smoothstep(-1.,1.,c)):mix(vec3(.04,.09,.12),vec3(.99,.64,.28),s.a);
    if(uView<1.5)col=mix(col,vec3(.96,.25,.48),s.g*.8);
    col+=vec3(.05,.14,.2)*s.b;
    gl_FragColor=vec4(mix(bg,col,1.-smoothstep(1.365,1.38,length(q))),1.);return;
  }
  vec2 span=box(ro,rd);float travel=span.y-span.x;
  if(travel<=0.){gl_FragColor=vec4(bg,1.);return;}
  float stride=travel/uSteps,t=span.x;bool hit=false;
  for(int i=0;i<112;i++){
    if(float(i)>=uSteps)break;
    t=span.x+(float(i)+.5)*stride;
    if(material(ro+rd*t)<0.){hit=true;break;}
  }
  if(!hit){
    // Nutrient in the pore liquid is deliberately quiet, not added noise.
    vec3 plane=ro+rd*(-ro.z/rd.z);vec4 liquid=state(plane.xy);
    bg+=vec3(.012,.027,.038)*liquid.b*(1.-smoothstep(1.25,1.4,length(plane.xy)));
    gl_FragColor=vec4(bg,1.);return;
  }
  float lo=t-stride,hi=t;
  for(int j=0;j<5;j++){float mid=(lo+hi)*.5;if(material(ro+rd*mid)<0.)hi=mid;else lo=mid;}
  vec3 p=ro+rd*hi;float e=3./uGrid*.32;
  vec3 n=normalize(vec3(material(p+vec3(e,0.,0.))-material(p-vec3(e,0.,0.)),material(p+vec3(0.,e,0.))-material(p-vec3(0.,e,0.)),material(p+vec3(0.,0.,e))-material(p-vec3(0.,0.,e))));
  vec4 s=state(p.xy);float c=s.r*3.-1.5;
  vec3 l=normalize(vec3(-.5,.65,1.)),l2=normalize(vec3(.9,-.3,.35));
  float ndv=max(dot(n,eye),0.),diff=max(dot(n,l),0.),fres=pow(1.-ndv,4.);
  float shadow=1.;
  for(int j=1;j<8;j++){float d=float(j)*.027;if(material(p+l*d)<-.002)shadow*=.78;}
  float phase=fract(.12+c*.16+s.g*.78+s.a*1.6);
  vec3 pal=texture2D(uPalette,vec2(phase,.5)).rgb;
  // Deposition history sets physical-inspired film thickness, not clock time.
  float optical=uFilm*(145.+s.a*1450.+s.g*390.+420.*smoothstep(-.4,.95,c));
  vec3 film=spectrum(optical,sqrt(max(.05,1.-(1.-ndv*ndv)/(1.46*1.46))));
  vec3 base=mix(pal,film,uSource*.78);
  float contour=.5+.5*cos(s.a*160.+s.g*42.+c*24.);
  float terraces=mix(.58,1.,smoothstep(.04,.25,contour));
  float spec=pow(max(dot(n,normalize(l+eye)),0.),85.);
  float spec2=pow(max(dot(n,normalize(l2+eye)),0.),44.);
  float edge=smoothstep(.05,.55,c-uCut);
  vec3 color=base*(.24+diff*1.05*shadow)*terraces;
  color+=film*(.10+.36*fres)+vec3(.65,.95,.87)*spec*1.35*shadow+vec3(.65,.32,.88)*spec2*.7;
  color+=pal*.19*s.g+vec3(.12,.33,.38)*(1.-edge)*.30;
  color*=mix(.66,1.,shadow);
  color=1.-exp(-color*1.35);
  color=pow(max(color,vec3(0.)),vec3(.90));
  gl_FragColor=vec4(color,1.);
}`;
