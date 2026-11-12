precision highp float;
attribute vec4 a_orbit;
attribute vec4 a_glyph;
uniform float u_time,u_swarmSize,u_swarmFlow,u_morph,u_touch;
uniform vec2 u_pointer;
varying vec2 vGlyphUV;
varying float vType,vPhase,vGlow;
#define TAU 6.283185307179586
void main(){
  vGlyphUV=uv;vType=a_glyph.x;
  float speed=u_swarmFlow*a_orbit.w;
  float t=u_time*speed;
  float a=a_orbit.x+t*0.5;
  float b=a_orbit.y+t*a_glyph.w;
  float shell=a_orbit.z;
  float eta=0.22+1.1*shell;
  vec4 hopf=vec4(cos(eta)*cos(a),cos(eta)*sin(a),sin(eta)*cos(b),sin(eta)*sin(b));
  float inv=max(1.55-hopf.w*0.72,0.32);
  vec3 center=hopf.xyz/inv*(0.75+shell*2.1);
  vec3 curl=vec3(sin(center.y*1.7+t),sin(center.z*2.0-t),sin(center.x*1.8+t*0.7));
  center+=curl*0.22*u_morph;
  float pointerDist=length(center.xy-u_pointer*1.8);
  float pull=exp(-pointerDist*pointerDist*1.8)*u_touch;
  center.xy+=u_pointer*pull*0.5;
  float spin=u_time*0.9*a_orbit.w+a_glyph.y*TAU;
  vec2 xy=position.xy;
  xy=mat2(cos(spin),-sin(spin),sin(spin),cos(spin))*xy;
  vec4 mv=modelViewMatrix*vec4(center,1.0);
  float scale=a_glyph.z*u_swarmSize*(0.65+0.45*sin(a*3.0-b*2.0+u_time*1.3));
  mv.xy+=xy*max(0.001,scale);
  vPhase=a_glyph.y+length(center)*0.18-u_time*0.08;
  vGlow=0.6+0.4*sin(a+b);
  gl_Position=projectionMatrix*mv;
}
