precision highp float;
varying vec2 vUv;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform sampler2D u_palette;
uniform float u_time, u_family, u_symmetry, u_density, u_iterations, u_inversion;
uniform float u_warp, u_morph, u_iridescence, u_saturation, u_moire, u_glitch, u_zoom, u_seed, u_phase;
uniform float u_touch;
#define PI 3.141592653589793
#define TAU 6.283185307179586
#define PHI 1.618033988749895
mat2 rotation(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
float hash21(vec2 p){p=fract(p*vec2(123.34,345.45));p+=dot(p,p+34.345);return fract(p.x*p.y);}
vec3 pal(float x){return texture2D(u_palette,vec2(fract(x+u_phase),0.5)).rgb;}
vec2 kaleido(vec2 p,float sides){
  float a=atan(p.y,p.x);float sec=TAU/max(sides,3.0);
  a=mod(a+sec*0.5,sec)-sec*0.5;
  return length(p)*vec2(cos(abs(a)),sin(abs(a)));
}
vec2 complexMul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 complexDiv(vec2 a,vec2 b){
  float d=max(dot(b,b),0.03);
  return vec2(a.x*b.x+a.y*b.y,a.y*b.x-a.x*b.y)/d;
}
float gyroid(vec3 p){return sin(p.x)*cos(p.y)+sin(p.y)*cos(p.z)+sin(p.z)*cos(p.x);}
float chladni(vec2 p,float a,float b){return cos(p.x*a)*cos(p.y*b)-cos(p.x*b)*cos(p.y*a);}
float qc(vec2 p,float n,float t){
  float a=0.0,b=0.0;
  for(int j=0;j<21;j++){
    if(float(j)>=n)break;
    float th=float(j)*PI/n;
    float pr=dot(p,vec2(cos(th),sin(th)));
    a+=cos(pr*3.8+sin(float(j)*PHI+t*0.5));
    b+=sin(pr*6.2*PHI-t+float(j)*0.33);
  }
  return (a+b*0.48)/sqrt(max(n,1.0));
}
float voro(vec2 p){
  vec2 ip=floor(p),fp=fract(p);
  float d=10.0;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
    vec2 cell=vec2(float(x),float(y)),rnd=vec2(hash21(ip+cell),hash21(ip+cell+71.4));
    vec2 dif=cell+0.18+0.64*rnd-fp;
    d=min(d,dot(dif,dif));
  }
  return sqrt(d);
}
vec3 measure(vec2 q,float t){
  float a=atan(q.y,q.x),r=length(q),n=floor(u_symmetry+0.5);
  float f=0.0,pore=0.0,relief=0.0;
  float d=max(0.3,u_density);
  float fam=floor(u_family+0.5);
  if(fam<0.5){
    // Original lineage: recursive kaleidoscopic box / spherical inversion orbit traps
    vec3 z=vec3(kaleido(q,n),0.38*cos(r*2.5-t*0.35));
    float trap=10.0,trGy=10.0,weight=1.0;
    for(int i=0;i<12;i++){
      if(float(i)>=u_iterations)break;
      z.xy=kaleido(z.xy,max(3.0,n*0.5));
      z=clamp(z,-vec3(0.9),vec3(0.9))*2.0-z;
      float rr=dot(z,z);
      z*=max(1.28/clamp(rr,u_inversion*u_inversion,1.2),1.0);
      float ang=float(i)*0.32+t*0.13+u_touch*0.3;
      z.xy=rotation(ang)*z.xy;
      z.yz=rotation(ang*0.618)*z.yz;
      z-=vec3(0.68,0.52,0.34);
      float gy=gyroid(z*d);
      float ch=chladni(z.xy*d,PHI,1.0/PHI);
      f+=cos((gy-0.22*abs(ch))*TAU+t*0.4)*weight;
      trap=min(trap,length(z));trGy=min(trGy,abs(gy-0.22*abs(ch)));
      weight*=0.77;
    }
    pore=exp(-trGy*4.0);relief=exp(-trap*9.0);f+=relief*1.5;
  }else if(fam<1.5){
    vec3 p=vec3(q*d,0.7*sin(r*3.0-t));float g=gyroid(p);float h=gyroid(p*PHI+vec3(t*0.25,0.0,-t*0.22));
    f=g*2.0+h*0.8;pore=1.0-abs(g);relief=sin(g*9.0+h*2.0);
  }else if(fam<2.5){
    float spokes=pow(abs(cos(a*n*0.5+t*0.15)),3.0);
    float rings=sin(r*d*15.0-t*1.2+spokes*1.8);
    f=rings+spokes*2.2+cos(a*n+r*d*8.0)*0.8;
    pore=sin(a*n*2.0+sin(r*12.0)*3.0)*sin(r*d*13.0);
    relief=spokes;
  }else if(fam<3.5){
    vec2 p=kaleido(q,n);
    float arch=abs(sin((p.x+sin(p.y*3.0+t*0.3)*0.14)*d*8.0));
    float vault=abs(sin((p.y+sin(p.x*2.5-t*0.5)*0.22)*d*11.0));
    f=log(0.01+arch*vault)*1.0+sin(r*27.0)*0.5;
    pore=1.0-min(arch,vault);relief=cos(p.y*15.0)*sin(p.x*15.0);
  }else if(fam<4.5){
    float a1=3.0+floor(n*0.35),b1=5.0+floor(n*0.65);
    f=chladni(q*d*0.85,a1,b1)+chladni(q*d*PHI,a1+1.0,b1-1.0)*0.65;
    pore=sin(f*10.0-t);relief=exp(-abs(f)*5.0);
  }else if(fam<5.5){
    f=qc(q*d,n,t)+0.45*qc(rotation(0.17)*q*d*PHI,n,t*0.7);
    pore=cos(f*4.0);relief=sin(f*11.0);
  }else if(fam<6.5){
    vec2 v1=q-vec2(-0.55,0.2),v2=q-vec2(0.6,-0.22);
    float a1=atan(v1.y,v1.x),a2=atan(v2.y,v2.x);
    float wave=sin(length(v1)*d*16.0-a1*4.0-t*2.0);
    float wave2=sin(length(v2)*d*15.0+a2*5.0+t*1.6);
    f=wave+wave2+0.6*sin(r*d*21.0+a*n-t);
    pore=wave*wave2;relief=abs(wave-wave2);
  }else if(fam<7.5){
    vec2 z=q;float trap=10.0,acc=0.0;
    for(int i=0;i<12;i++){
      if(float(i)>=u_iterations)break;
      float rr=max(dot(z,z),u_inversion*u_inversion*0.3);
      z=abs(z)/rr-vec2(1.0,0.9);
      z=rotation(0.19+t*0.015)*z;
      trap=min(trap,length(z));acc+=exp(-length(z))*pow(0.75,float(i));
    }
    f=acc+log(0.002+trap)*1.2;
    pore=cos(trap*20.0);relief=exp(-trap*7.0);
  }else if(fam<8.5){
    float cell=voro((q+0.04*sin(q.yx*4.0+t))*d*4.0);
    float cell2=voro(q*d*9.0+t*0.06);
    f=sin(cell*20.0)+cos(cell2*13.0)*0.9;
    pore=1.0-cell;relief=exp(-cell*8.0);
  }else if(fam<9.5){
    vec2 p=rotation(t*0.012)*q;
    float s1=sin(p.x*d*27.0)*sin(p.y*d*27.0);
    float s2=sin(dot(p,vec2(0.866,-0.5))*d*31.0)*sin(dot(p,vec2(0.5,0.866))*d*31.0);
    f=s1+s2+sin(s1*s2*8.0)*0.5;pore=s1*s2;relief=abs(s1+s2);
  }else if(fam<10.5){
    vec2 zz=complexDiv(q+vec2(0.23,0.0),complexMul(vec2(0.38,0.1),q)+vec2(1.0,0.0));
    float rr=length(zz),th=atan(zz.y,zz.x);
    f=cos(th*n+r*d*12.0+t*0.6)+sin(log(rr+0.03)*d*14.0-th*3.0+t);
    pore=cos(rr*23.0);relief=sin(th*n);
  }else if(fam<11.5){
    vec2 p=q+vec2(sin(q.y*5.0-t)*0.22,cos(q.x*5.0+t)*0.22);
    float a0=atan(p.y,p.x);
    f=sin(p.x*d*15.0+sin(p.y*4.0+t)*2.0)+cos(p.y*d*22.0+sin(p.x*3.0-t)*2.5);
    pore=sin(a0*n+r*11.0);relief=cos(f*10.0);
  }else if(fam<12.5){
    vec2 h=vec2(sinh(clamp(q.x*0.8,-3.0,3.0)),sin(q.y*1.2));
    f=sin(h.x*d*11.0+t)+cos((h.y+length(h)*0.3)*d*23.0-t*0.6);
    pore=sin(f*6.0);relief=cos(length(h)*20.0);
  }else if(fam<13.5){
    float spiral=log(r+0.04)*d*12.0+a*n*0.55-t;
    f=sin(spiral)+cos(spiral*PHI+sin(a*n))*0.8;
    pore=sin(spiral*3.0);relief=cos(spiral*7.0);
  }else if(fam<14.5){
    vec3 g=vec3(q*d,0.8*sin(q.x*8.0+t));
    f=gyroid(g)+0.7*gyroid(g*2.0+vec3(t*0.3))+0.35*gyroid(g*4.0);
    pore=sin(f*7.0);relief=exp(-abs(f)*2.5);
  }else {
    vec2 z=q;float acc=0.0;
    for(int i=0;i<10;i++){
      if(float(i)>=u_iterations)break;
      z=abs(z)/(clamp(dot(z,z),0.09,2.5))-vec2(1.2,0.8);
      z=rotation(0.23+sin(t*0.18)*0.1)*z;
      acc+=sin(dot(z,vec2(7.0,11.0))+t)*pow(0.75,float(i));
    }
    f=acc;pore=sin(acc*8.0);relief=cos(acc*4.0);
  }
  return vec3(f,pore,relief);
}
void main(){
  vec2 uv=vUv;
  vec2 p=(uv-0.5)*2.0;
  p.x*=u_resolution.x/max(u_resolution.y,1.0);
  p*=u_zoom;
  float t=u_time;
  if(u_glitch>0.001){
    float band=floor(uv.y*68.0+t*9.0),rnd=hash21(vec2(band,floor(t*18.0)));
    p.x+=(rnd>0.88-u_glitch*0.14?sin(band*19.4)*0.12*u_glitch:0.0);
  }
  vec2 pointer=u_pointer;
  vec2 pp=p-pointer*0.64;
  float rr=max(length(pp),0.02);
  p+=vec2(-pp.y,pp.x)*(u_touch*0.11+u_warp*0.02)/(0.26+rr);
  p+=pp*0.085*u_touch*sin(rr*13.0-t*2.0);
  float wm=clamp(u_warp,0.0,3.0);
  vec2 c=vec2(0.18,0.07)*wm+pointer.yx*wm*0.16;
  vec2 warped=complexDiv(p+pointer*0.16*wm,complexMul(c,p)+vec2(1.0,0.08*sin(t*0.16)));
  p=mix(p,warped,clamp(wm*0.34,0.0,0.76));
  p=rotation(t*0.017+u_morph*0.08*sin(t*0.25))*p;
  p+=u_morph*0.1*vec2(sin(p.y*5.0+t*0.65),cos(p.x*5.0-t*0.48));
  vec3 v=measure(p,t);
  float h=v.x*0.7+v.y*0.32+v.z*0.19;
  vec2 grad=vec2(dFdx(h),dFdy(h));
  float g=length(grad),fringe=h*u_iridescence*0.3-t*0.09;
  float shift=clamp(g*12.0*u_moire*0.045,0.003,0.3);
  vec3 a=pal(fringe+shift),b=pal(fringe),c2=pal(fringe-shift);
  vec3 color=vec3(a.r,b.g,c2.b);
  float wall=smoothstep(0.16,0.65,abs(sin(v.y*4.5+v.x)));
  color*=mix(0.22,1.45,wall);
  vec3 N=normalize(vec3(-grad*45.0,1.0));
  vec3 l=normalize(vec3(cos(t*0.6),sin(t*0.5),0.9));
  float spec=pow(max(dot(N,normalize(l+vec3(0.0,0.0,1.0))),0.0),36.0);
  float fres=pow(1.0-max(N.z,0.0),2.0);
  color+=vec3(1.0,0.96,0.85)*spec*0.9+pal(fringe+0.45)*fres*1.3;
  float ink=sin(p.x*u_moire*10.0+sin(p.y*u_moire*6.5))*sin(p.y*u_moire*10.8);
  color*=mix(1.0,0.8+0.35*ink,clamp(u_moire/3.0,0.0,0.72));
  float lum=dot(color,vec3(0.299,0.587,0.114));
  color=mix(vec3(lum),color,u_saturation);
  color=max(color,vec3(0.0));
  color=vec3(1.0)-exp(-color*(0.88+u_saturation*0.17));
  float vig=1.0-smoothstep(0.65,1.7,length((uv-0.5)*2.0));
  color*=mix(0.75,1.0,vig);
  gl_FragColor=vec4(color,1.0);
}
