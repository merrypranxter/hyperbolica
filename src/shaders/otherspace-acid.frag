
precision highp float;
uniform vec2 resolution,center,viewportOrigin;
uniform float time,mode,projection,zoom,rotation,drift,p,q,depth,density,shape,twist,phase,width,relief,exposure,saturation,colorPhase,colorScale,grain,glow,speed,kal,prism,dots;
uniform float fillOn,lineOn,detailOn,haloOn,hardPalette,reversePalette,animatePalette,spectrumOn,invertOn,scanOn,embossOn,vignetteOn,edgeOn,motionOn,kaleidoOn,prismOn,halftoneOn,glitterOn,neonOn;
uniform vec3 c0,c1,c2,c3,c4;
uniform float acidOpacity,acidSolo;
#define PI 3.141592653589793
#define TAU 6.283185307179586
float hash(vec2 a){return fract(sin(dot(a,vec2(127.1,311.7)))*43758.5453123);}
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
vec2 mul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 divc(vec2 a,vec2 b){return vec2(dot(a,b),a.y*b.x-a.x*b.y)/max(dot(b,b),1e-9);}
vec2 mobius(vec2 z,vec2 a){return divc(z-a,vec2(1.,0.)-mul(vec2(a.x,-a.y),z));}
float ash(float x){return sign(x)*log(abs(x)+sqrt(x*x+1.));}
float ach(float x){x=max(x,1.);return log(x+sqrt(max(x*x-1.,0.)));}
float hd(vec2 z,vec2 a){return ach(1.+2.*dot(z-a,z-a)/max((1.-dot(z,z))*(1.-dot(a,a)),1e-7));}
float stripe(float f,float w){float aa=max(fwidth(f),.001);return 1.-smoothstep(w,w+aa,abs(f));}
float bands(float f,float w){return stripe(sin(f),w);}
// disk -> upper half-plane (Cayley): w = i(1+z)/(1-z)
vec2 uhp(vec2 z){return divc(vec2(-z.y,1.+z.x),vec2(1.-z.x,-z.y));}
vec3 pal(float t){
 t=t*colorScale+colorPhase;if(animatePalette>.5)t+=time*.05;t=fract(t);if(reversePalette>.5)t=1.-t;float s=t;
 if(hardPalette>.5)t=floor(t*5.)/5.;t*=5.;vec3 c;
 if(t<1.)c=mix(c0,c1,t);else if(t<2.)c=mix(c1,c2,t-1.);else if(t<3.)c=mix(c2,c3,t-2.);else if(t<4.)c=mix(c3,c4,t-3.);else c=mix(c4,c0,t-4.);
 if(spectrumOn>.5)c=mix(c,.5+.5*cos(TAU*(s+vec3(0.,.33,.67))),.55);
 return c;}
vec3 ink(float t){if(prismOn>.5){float d=.04*prism;return vec3(pal(t+d).r,pal(t).g,pal(t-d).b);}return pal(t);}

vec3 field(vec2 z,float t){
 float r=length(z),rho=log((1.+r)/max(1.-r,1e-4));
 float val=0.,line=0.,detail=0.,w=.035*width;

 if(mode<.5){
  // 0 MODULAR: fold the half-plane by PSL(2,Z) (z->z+1, z->-1/z). Ford circles = images of Im z > h.
  vec2 h=uhp(z);h.x+=t*.06;float n=0.;
  for(int i=0;i<48;i++){if(float(i)>=depth)break;h.x-=floor(h.x+.5);float d=dot(h,h);if(d<1.){h=vec2(-h.x,h.y)/d;n+=1.;}else break;}
  float wall=min(abs(ash((.5-abs(h.x))/h.y)),abs(ash((dot(h,h)-1.)/(2.*h.y))));
  float hh=.9+shape*.45,ford=smoothstep(0.,.04,h.y-hh),lf=log(h.y/hh);
  val=mod(n,2.)*.17+n*.031+ford*.31+.12*log(h.y);
  line=max(stripe(wall,w),stripe(lf,w));
  detail=mix(bands(log(h.y)*density*3.+twist*h.x,.12*width)*.6,bands(TAU*h.x*p+twist*lf*3.,.25*width),ford);
 }
 else if(mode<1.5){
  // 1 BAND FRIEZE: Fermi coordinates (u along a geodesic, d = signed distance from it). Two guilloche wave families.
  vec2 qq=divc(vec2(1.+z.x,z.y),vec2(1.-z.x,-z.y));
  float u=log(max(length(qq),1e-6)),v=atan(qq.y,qq.x),d=ash(tan(clamp(v,-1.55,1.55)));
  float cu=u*density*.35+t*.25;
  float f1=d*p*.45-shape*sin(cu+twist*d*.5),f2=d*q*.45+shape*sin(cu-twist*d*.5);
  val=.13*floor(f1)+.21*floor(f2)+.08*sin(cu*2.);
  line=max(bands(f1*PI,.1*width),bands(f2*PI,.1*width));
  detail=pow(abs(cos(f1*PI)*cos(f2*PI)),6.)*(.5+.5*cos(cu*4.));
 }
 else if(mode<2.5){
  // 2 SCHOTTKY: reflect in p geodesic mirrors. shape=4 -> ideal p-gon tiling; smaller -> Cantor-dust limit set.
  float al=(PI/p)*mix(.5,1.,clamp(shape*.25,0.,1.)),R=tan(al),s=1./cos(al),n=0.,sec=TAU/p;vec2 c;
  for(int i=0;i<48;i++){if(float(i)>=depth)break;float k=floor(atan(z.y,z.x)/sec+.5)*sec;c=s*vec2(cos(k),sin(k));vec2 v=z-c;float d=dot(v,v);if(d<R*R){z=c+v*(R*R/d);n+=1.;}else break;}
  float k2=floor(atan(z.y,z.x)/sec+.5)*sec;c=s*vec2(cos(k2),sin(k2));
  float wall=abs(ash((dot(z-c,z-c)-R*R)/(R*max(1.-dot(z,z),1e-4))));
  val=n*.11+mod(n,2.)*.2+wall*.06;
  line=stripe(wall,w);
  detail=bands(wall*density*2.-t*.6+twist*atan(z.y,z.x),.15*width)*exp(-wall*.35);
 }
 else if(mode<3.5){
  // 3 CHAINMAIL ORBIFOLD: fold into the (2,p,q) triangle, then ring families around all three corner points.
  float A=PI/p,B=PI/q,cc=cos(B)/sqrt(max(cos(B)*cos(B)-sin(A)*sin(A),1e-4)),rr=sqrt(max(cc*cc-1.,0.)),n=0.;
  for(int i=0;i<48;i++){if(float(i)>=depth)break;float a=atan(z.y,z.x);a=mod(a+A,2.*A)-A;if(a<0.)n+=1.;z=length(z)*vec2(cos(a),abs(sin(a)));vec2 v=z-vec2(cc,0.);float d=dot(v,v);if(d<rr*rr){z=vec2(cc,0.)+v*(rr*rr/max(d,1e-8));n+=1.;}else break;}
  float vr=cc*cos(A)-sqrt(max(cc*cc*cos(A)*cos(A)-1.,0.));
  float f0=hd(z,vec2(0.))*density,f1=hd(z,vr*vec2(cos(A),sin(A)))*density,f2=hd(z,vec2(cc-rr,0.))*density*(1.+shape*.5);
  val=.1*floor(f0/PI)+.17*floor(f1/PI)+.23*floor(f2/PI)+mod(n,2.)*.05;
  line=max(bands(f0-t*.4,.1*width),bands(f1+t*.4,.1*width));
  detail=bands(f2+twist*sin(f0-f1),.1*width);
 }
 else if(mode<4.5){
  // 4 BINARY TILING (Boroczky): bricks [k 2^n,(k+1) 2^n] x [2^n,2^(n+1)] in the half-plane. Not vertex-transitive, still all congruent.
  vec2 h=uhp(z)*density*.4;h.x+=t*.25;
  float ly=log2(h.y),k=floor(ly),xi=h.x/exp2(k)+twist*.08*sin(k*1.7+t*.3),cx=floor(xi),u=fract(xi),v=fract(ly);
  float du=min(u,1.-u),dv=min(v,1.-v),m=length(vec2(u-.5,v-.5));
  val=fract(cx*.381966+k*.27)+m*.2;
  line=max(stripe(min(du,dv*.69),w),stripe(abs(fract(u*(q-2.)+.5)-.5),.02*width)*step(v,.5));
  detail=bands(m*TAU*p*.5+shape*sin(TAU*u)*sin(PI*v)-t*.5,.22*width);
 }
 else if(mode<5.5){
  // 5 BLASCHKE BLOOM: iterate a finite Blaschke product (a self-map of the disk) and domain-colour the result.
  vec2 b=z;float iters=clamp(q-2.,1.,4.),rad=min(.15+.17*shape,.86);
  for(int it=0;it<4;it++){if(float(it)>=iters)break;vec2 pr=vec2(1.,0.);
   for(int k=0;k<16;k++){if(float(k)>=p)break;float fk=float(k),an=fk*2.3999632+phase*TAU+t*.08*(1.-2.*mod(float(it),2.));pr=mul(pr,mobius(b,rad*sqrt((fk+.35)/p)*vec2(cos(an),sin(an))));}
   b=rot(twist*.3)*pr;float bl=length(b);if(bl>.9995)b*=.9995/bl;}
  float ar=atan(b.y,b.x),hr=-log(max(length(b),1e-6));
  val=hr*.11+.2*sin(ar*2.)+.1*sin(ar*3.+hr);
  line=max(bands(ar*4.,.1*width),bands(hr*density,.1*width));
  detail=pow(.5+.5*sin(ar*8.)*sin(hr*density*2.),8.);
 }
 else if(mode<6.5){
  // 6 CONFOCAL MOIRE: hyperbolic ellipses (d1+d2) and hyperbolas (d1-d2) about two foci.
  vec2 zz=rot(t*.07+twist*.3)*z;float f=clamp(.12+.19*shape,0.,.86);
  float d1=hd(zz,vec2(-f,0.)),d2=hd(zz,vec2(f,0.)),s=(d1+d2)*density*.5,h=(d1-d2)*p*.6;
  val=.12*floor(s/PI)+.19*floor(h/PI)+.3*step(0.,sin(s)*sin(h));
  line=max(bands(s,.1*width),bands(h,.1*width));
  detail=bands(d1*density*2.-t,.3*width)*bands(d2*density*2.+t,.3*width);
 }
 else if(mode<7.5){
  // 7 DIPOLE: loxodromic coordinates log((z-a)/(z-b)). Integer p,q keep the spirals seamless around both poles.
  float f=clamp(.1+.19*shape,.05,.86);vec2 qq=divc(z-vec2(-f,0.),z-vec2(f,0.));
  vec2 L=vec2(log(max(length(qq),1e-6)),atan(qq.y,qq.x));
  float g1=p*L.y+twist*L.x*2.-t*.6,g2=q*L.y-density*L.x*1.5+t*.4;
  val=L.x*.15+.33*step(0.,sin(g1)*sin(g2))+.1*sin(g1);
  line=max(bands(g1,.1*width),bands(g2,.1*width));
  detail=pow(max(0.,sin(g1)*sin(g2)),4.);
 }
 else if(mode<8.5){
  // 8 TIMES TABLE: geodesics joining boundary point theta to m*theta. Exact distance to each via (z-a)/(z-b).
  float N=p*4.,m=(q-1.)+shape*.25+t*.02,dmin=50.,cnt=0.,gl=0.;
  for(int i=0;i<64;i++){float fi=float(i);if(fi>=N)break;
   float th=TAU*fi/N+phase*TAU,th2=th*m;vec2 a=vec2(cos(th),sin(th)),b=vec2(cos(th2),sin(th2));
   if(dot(a-b,a-b)<4e-4)continue;
   vec2 ab=a+b;float l=length(ab);vec2 c=l>.05?ab/l:vec2(-a.y,a.x);
   vec2 u=normalize(divc(c-a,c-b)),nn=vec2(-u.y,u.x);if(dot(divc(a,b),nn)<0.)nn=-nn;
   vec2 wz=divc(z-a,z-b);float sd=dot(wz,u)/max(dot(wz,nn),1e-5),d=abs(ash(sd));
   dmin=min(dmin,d);cnt+=step(0.,sd);gl+=exp(-d*density);}
  val=cnt*.045+dmin*.2;
  line=stripe(dmin,.03*width);
  detail=clamp(bands(dmin*density*4.+twist*cnt,.2*width)*exp(-dmin*2.)+gl*.04,0.,1.);
 }
 else{
  // 9 APOLLONIAN: exact gasket. Four mirror circles, each orthogonal to three of the four tangent generator circles.
  float n=0.,sc=1.,r2o=dot(z,z);z=rot(twist*.2)*z;
  for(int i=0;i<48;i++){if(float(i)>=depth)break;float d0=dot(z,z);
   if(d0<.0717968){float k=.0717968/max(d0,1e-9);z*=k;sc*=k;n+=1.;continue;}
   float th=PI/3.+floor((atan(z.y,z.x)-PI/3.)/(TAU/3.)+.5)*TAU/3.;vec2 c=2.*vec2(cos(th),sin(th)),v=z-c;float d=dot(v,v);
   if(d<3.){float k=3./d;z=c+v*k;sc*=k;n+=1.;}else break;}
  float dc=abs(length(z)-1.);
  for(int j=0;j<3;j++){float th=float(j)*TAU/3.;dc=min(dc,abs(length(z-.5358984*vec2(cos(th),sin(th)))-.4641016));}
  float de=dc/sc,hy=de*2./max(1.-r2o,1e-4);
  val=.6*exp(-hy*.9)+.05*log(sc);
  line=stripe(hy,.03*width);
  detail=bands(log(max(de,1e-7))*density+shape*sin(n)-t*.5,.2*width)*exp(-hy*.5);
 }
 return vec3(val,clamp(line,0.,1.),clamp(detail,0.,1.));
}

void main(){
 vec2 fc=gl_FragCoord.xy-viewportOrigin;float mn=min(resolution.x,resolution.y);
 vec2 uv=(2.*fc-resolution)/mn;vec3 bg=c0*.12;float mask=1.,r0=length(uv);vec2 z;
 if(projection<1.5){
  z=uv/(.91*zoom);r0=length(z);mask=1.-smoothstep(1.-2./mn,1.,r0);
  if(r0>=1.){gl_FragColor=vec4(bg,acidSolo>.5?1.:0.);return;}
  if(projection>.5)z=z/(1.+sqrt(max(1.-dot(z,z),1e-6)));
 }else if(projection<2.5){
  vec2 h=vec2(uv.x,uv.y+resolution.y/mn)*1.3/zoom;
  if(h.y<=1e-4){gl_FragColor=vec4(bg,acidSolo>.5?1.:0.);return;}
  z=divc(h-vec2(0.,1.),h+vec2(0.,1.));r0=length(z);
 }else{
  vec2 b=uv*.7853982/(.9*zoom);
  if(abs(b.y)>=.7853){gl_FragColor=vec4(bg,acidSolo>.5?1.:0.);return;}
  mask=1.-smoothstep(.775,.7853,abs(b.y));
  float x2=clamp(2.*b.x,-18.,18.),e=exp(x2),ch=.5*(e+1./e),sh=.5*(e-1./e);
  z=vec2(sh,sin(2.*b.y))/(ch+cos(2.*b.y));r0=length(z);
 }
 float t=time*speed*motionOn;
 vec2 cen=center+drift*.23*vec2(sin(t*.13),cos(t*.11)-1.);float cr=length(cen);if(cr>.87)cen*=.87/cr;
 z=mobius(z,cen);z=rot(rotation+t*.025*drift)*z;
 if(kaleidoOn>.5){float a=atan(z.y,z.x),s=PI/kal;a=abs(mod(a,2.*s)-s);z=length(z)*vec2(cos(a),sin(a));}
 float r=length(z);if(r>.9995)z*=.9995/r;
 vec3 f=field(z,t);float tt=f.x+phase;vec3 color=bg;
 if(fillOn>.5)color=mix(c0*.14,ink(tt),.35+.65*(.5+.5*sin(f.x*TAU)));
 if(lineOn>.5)color=mix(color,ink(tt+.32)*1.15,f.y*.95);
 if(detailOn>.5)color=mix(color,ink(tt+.65),f.z*.75);
 if(haloOn>.5)color+=ink(tt+.2)*pow(f.y,.45)*glow*.4;
 if(embossOn>.5){float h=f.y*.7+f.z*.3+f.x*.2;vec3 n=normalize(vec3(-dFdx(h)*relief*60.,-dFdy(h)*relief*60.,1.));float li=.38+.68*max(dot(n,normalize(vec3(-.5,.7,1.))),0.);color*=li;color+=ink(tt+.5)*pow(max(dot(n,normalize(vec3(-.3,.4,1.))),0.),28.)*relief*.35;}
 if(edgeOn>.5)color+=pal(.6)*bands(log((1.+r)/max(1.-r,1e-4))*8.,.04)*.2;
 if(glitterOn>.5){float h=hash(floor(gl_FragCoord.xy/2.));color+=step(.982,h)*pow(max(0.,sin(time*3.+h*90.)),24.)*(f.y+f.z*.5)*vec3(1.,.92,1.)*1.6;}
 if(halftoneOn>.5){vec2 g=rot(.52)*fc/mn*(40.+dots*140.);float lum=clamp(dot(color,vec3(.3,.6,.1)),0.,1.);color*=.22+1.05*(1.-smoothstep(-.04,.04,length(fract(g)-.5)-.66*sqrt(lum)));}
 if(vignetteOn>.5)color*=1.-.42*pow(min(r0,1.),4.);
 float lum=dot(color,vec3(.2126,.7152,.0722));color=mix(vec3(lum),color,saturation);color=max(color,0.);
 color=vec3(1.)-exp(-color*exposure);
 if(neonOn>.5){float m=min(color.r,min(color.g,color.b));color=(color-m*.7)/(1.-m*.7+1e-3);}
 if(scanOn>.5)color*=.88+.12*sin(gl_FragCoord.y*PI);
 color+=(hash(gl_FragCoord.xy+phase*111.)-.5)*grain*.14;color=clamp(color,0.,1.);
 if(invertOn>.5)color=1.-color;
 gl_FragColor=vec4(mix(bg,color,mask),acidSolo>.5?1.:clamp(acidOpacity,0.,1.)*mask);
}
