precision highp float;
attribute vec2 a_uvParam;
uniform float u_time,u_mode,u_symmetry,u_morph,u_density,u_touch,u_seed;
uniform vec2 u_pointer;
varying vec3 vWorldPosition,vNormal;
varying vec2 vParam;
varying float vStress,vDisplacement;
#define PI 3.141592653589793
#define TAU 6.283185307179586
mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float gyro(vec3 p){return sin(p.x)*cos(p.y)+sin(p.y)*cos(p.z)+sin(p.z)*cos(p.x);}
vec3 surface(float u,float v,float t,out float stress,out float disp){
  float phi=v*0.5, n=floor(u_symmetry+0.5);
  float m=u_mode;
  vec3 pos=vec3(0.0);
  disp=0.0;
  stress=0.0;
  float su=sin(phi),cu=cos(phi);
  vec3 sp=vec3(su*cos(u),cu,su*sin(u));
  float harmonic=sin(n*u+t*0.8)*cos(n*0.5*v-t*0.45);
  float tex=gyro(sp*u_density*5.0+vec3(0.0,t*0.25,0.0));
  if(m<0.5){
    // Fenestrated radiolarian shell
    disp=(harmonic*0.24+tex*0.1)*u_morph;
    pos=sp*(1.45+disp);
  }else if(m<1.5){
    // Clifford torus on S3, rotating in xw/yz and stereographically projected
    vec4 p4=vec4(0.72*cos(u),0.72*sin(u),0.69*cos(v),0.69*sin(v));
    p4.xw=rot(t*0.27+u_pointer.x*0.4)*p4.xw;
    p4.yz=rot(t*0.33+u_pointer.y*0.4)*p4.yz;
    p4.zw=rot(t*0.21)*p4.zw;
    pos=p4.xyz/max(1.52-p4.w,0.35)*1.75;
    disp=sin(u*n*0.5+v*3.0+t)*0.17*u_morph;
    pos+=normalize(pos+vec3(1.0e-4))*disp;
  }else if(m<2.5){
    // 3:5 harmonic torus knot with an actual tube
    float rr=1.12+0.38*cos(5.0*u);
    vec3 core=vec3(rr*cos(3.0*u),rr*sin(3.0*u),0.38*sin(5.0*u));
    vec3 tangent=normalize(vec3(-sin(3.0*u),cos(3.0*u),0.5*cos(5.0*u)));
    vec3 binorm=normalize(cross(tangent,vec3(0.0,0.0,1.0))+vec3(0.0001,0.0,0.0));
    vec3 norm=cross(binorm,tangent);
    disp=sin(u*n+v*4.0-t*1.3)*0.16*u_morph;
    pos=core+(binorm*cos(v)+norm*sin(v))*(0.34+disp);
  }else if(m<3.5){
    // Gyroid-grown egg; sculpted via two frequencies
    float g=gyro(sp*u_density*7.0+vec3(0.0,t*0.5,0.0));
    float g2=gyro(sp*u_density*12.0-vec3(t*0.3,0.0,t*0.2));
    disp=(g*0.17+g2*0.07)*u_morph;
    pos=sp*(1.4+disp);
  }else if(m<4.5){
    // Klein bottle immersion
    float a=2.8, z=0.0;
    if(u<PI){
      pos.x=(a+cos(u*0.5)*sin(v)-sin(u*0.5)*sin(2.0*v))*cos(u);
      pos.y=(a+cos(u*0.5)*sin(v)-sin(u*0.5)*sin(2.0*v))*sin(u);
    }else{
      pos.x=(a+cos(u*0.5)*sin(v)-sin(u*0.5)*sin(2.0*v))*cos(u);
      pos.y=(a+cos(u*0.5)*sin(v)-sin(u*0.5)*sin(2.0*v))*sin(u);
    }
    pos.z=sin(u*0.5)*sin(v)+cos(u*0.5)*sin(2.0*v);
    pos=pos*0.44;
    disp=0.12*u_morph*sin(n*v+3.0*u+t);
    pos+=normalize(pos+vec3(0.0001))*disp;
  }else if(m<5.5){
    // Möbius-like ribbon; animated torsion
    float w=sin(v)*0.72;
    float twist=0.5*u+sin(u*3.0+t)*0.16*u_morph;
    pos=vec3((1.35+w*cos(twist))*cos(u),w*sin(twist),(1.35+w*cos(twist))*sin(u));
    disp=w;
  }else if(m<6.5){
    // Logarithmically expanding chiral shell
    float grow=exp(u/TAU*0.9),tor=0.18+0.32*(v/TAU);
    float coil=3.0*u+t*0.15;
    pos=vec3((0.4+grow*0.6)*cos(coil)+tor*cos(v)*cos(coil),
             (0.4+grow*0.6)*sin(coil)+tor*cos(v)*sin(coil),
             (u/TAU-0.5)*1.6+tor*sin(v));
    disp=sin(n*v+u*6.0-t)*0.14*u_morph;
    pos+=normalize(pos+vec3(0.001))*disp;
  }else if(m<7.5){
    // Toroidal braid / hydrogel knot lattice
    float braid=0.27*cos(n*u*0.5+v*2.0+t*0.8)*u_morph;
    float R=1.25+(0.52+braid)*cos(v);
    pos=vec3(R*cos(u), (0.52+braid)*sin(v), R*sin(u));
    disp=braid;
  }else if(m<8.5){
    // Reentrant hyperboloid; evolving throat
    float y=sin(v)*1.4;
    float throat=0.40+0.75*sqrt(1.0+y*y);
    float lobe=1.0+0.15*sin(n*u+v*3.0+t)*u_morph;
    pos=vec3(throat*lobe*cos(u),y,throat*lobe*sin(u));
    disp=lobe;
  }else if(m<9.5){
    // Chladni resonance plate; deforming rather than spinning
    float rad=v/TAU*1.6;
    float xx=rad*cos(u),yy=rad*sin(u);
    float ch=cos(xx*n)*cos(yy*(n+3.0))-cos(xx*(n+3.0))*cos(yy*n);
    pos=vec3(xx,yy,ch*u_morph*0.46*sin(t*0.7+0.85));
    disp=ch;
  }else if(m<10.5){
    // Crystalline rounded octahedron
    float fac=pow(pow(abs(sp.x),0.8)+pow(abs(sp.y),0.8)+pow(abs(sp.z),0.8),-1.1);
    disp=0.1*u_morph*sin(n*u+v*9.0+t*0.7);
    pos=sp*(fac*1.4+disp);
  }else{
    // Oscillating nested silica cage
    float lace=sin(n*u+v*5.0+t)*cos(n*v*0.5-u*3.0);
    float r=1.15+0.3*abs(lace)*u_morph;
    pos=sp*r;
    disp=lace;
  }
  // True vertex displacement: breathing, pinching and torsional point interaction
  float field=gyro(pos*u_density*4.0+vec3(t*0.2,-t*0.25,0.0));
  stress=abs(harmonic)*0.7+abs(field)*0.4+abs(disp)*1.3;
  float tug=exp(-length(pos.xy-u_pointer*1.5)*2.2)*u_touch;
  vec3 dir=normalize(pos+vec3(0.001));
  pos+=dir*(sin(t*1.1+field*2.2)*0.055*u_morph+tug*0.28);
  return pos;
}
void main(){
  float u=a_uvParam.x,v=a_uvParam.y;
  float s0,d0,s1,d1,s2,d2;
  vec3 p=surface(u,v,u_time,s0,d0);
  vec3 pu=surface(u+0.010,v,u_time,s1,d1);
  vec3 pv=surface(u,v+0.010,u_time,s2,d2);
  vec3 N=normalize(cross(pu-p,pv-p)+vec3(0.000001,0.000002,0.000003));
  vec4 world=modelMatrix*vec4(p,1.0);
  vWorldPosition=world.xyz;
  vNormal=normalize(mat3(modelMatrix)*N);
  vParam=a_uvParam;vStress=s0;vDisplacement=d0;
  gl_Position=projectionMatrix*viewMatrix*world;
}
