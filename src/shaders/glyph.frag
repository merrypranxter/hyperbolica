precision highp float;
varying vec2 vGlyphUV;
varying float vType,vPhase,vGlow;
uniform sampler2D u_palette;
uniform float u_time,u_iridescence,u_saturation,u_phase;
#define PI 3.141592653589793
vec3 pal(float t){return texture2D(u_palette,vec2(fract(t+u_phase),0.5)).rgb;}
void main(){
  vec2 p=vGlyphUV*2.0-1.0;
  float r=length(p);
  if(r>1.0)discard;
  float a=atan(p.y,p.x),shape=0.0;
  float core=exp(-r*4.0);
  if(vType<0.5){
    float star=0.62+0.28*cos(a*6.0)+0.08*cos(a*12.0);
    shape=1.0-smoothstep(star-0.12,star+0.04,r);
    shape*=0.55+0.45*sin(r*35.0-u_time*1.4);
  }else if(vType<1.5){
    shape=smoothstep(0.30,0.6,sin(r*29.0-u_time*1.2));
  }else if(vType<2.5){
    vec2 q=vec2(p.x*0.88,p.y*1.35);
    shape=(1.0-smoothstep(0.64,0.9,length(q)))*(0.3+0.7*sin(r*25.0+u_time));
  }else if(vType<3.5){
    float diamond=abs(p.x)+abs(p.y);
    shape=1.0-smoothstep(0.06,0.11,abs(diamond-0.8));
    shape+=1.0-smoothstep(0.04,0.11,min(abs(p.x),abs(p.y)));
  }else if(vType<4.5){
    shape=1.0-smoothstep(0.14,0.25,abs(r-0.6-0.1*sin(a*8.0)));
  }else{
    shape=1.0-smoothstep(0.10,0.24,abs(cos(a*5.0)*r-0.38));
  }
  shape=clamp(shape,0.0,1.0);
  float alpha=clamp(shape*0.9+core*0.35,0.0,1.0)*(1.0-smoothstep(0.75,1.0,r));
  if(alpha<0.03)discard;
  float phase=vPhase*u_iridescence*0.3+r*0.26;
  vec3 color=mix(pal(phase),pal(phase+0.34),shape*0.48);
  color+=vec3(1.0,0.96,0.92)*pow(core,2.0)*0.55;
  float lum=dot(color,vec3(0.299,0.587,0.114));
  color=mix(vec3(lum),color,u_saturation);
  gl_FragColor=vec4(min(max(color,vec3(0.0)),vec3(1.0)),alpha*vGlow);
}
