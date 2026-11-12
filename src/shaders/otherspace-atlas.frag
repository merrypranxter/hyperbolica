
precision highp float;
uniform vec2 resolution,center,viewportOrigin;
uniform float time,mode,projection,zoom,rotation,drift,p,q,depth,density,shape,twist,phase,width,relief,exposure,saturation,colorPhase,colorScale,grain,glow,speed;
uniform float fillOn,lineOn,detailOn,haloOn,hardPalette,reversePalette,animatePalette,invertOn,scanOn,embossOn,vignetteOn,edgeOn,motionOn;
uniform vec3 c0,c1,c2,c3,c4;
uniform float atlasOpacity;
#define PI 3.141592653589793
#define TAU 6.283185307179586
float hash(vec2 a){return fract(sin(dot(a,vec2(127.1,311.7)))*43758.5453123);}
mat2 rot(float a){return mat2(cos(a),-sin(a),sin(a),cos(a));}
vec2 mul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 divc(vec2 a,vec2 b){return vec2(dot(a,b),a.y*b.x-a.x*b.y)/max(dot(b,b),1e-8);}
vec2 mobius(vec2 z,vec2 a){return divc(z-a,vec2(1.,0.)-mul(vec2(a.x,-a.y),z));}
float ash(float x){return sign(x)*log(abs(x)+sqrt(x*x+1.));}
float ach(float x){x=max(x,1.);return log(x+sqrt(max(x*x-1.,0.)));}
float hd(vec2 z,vec2 a){return ach(1.+2.*dot(z-a,z-a)/max((1.-dot(z,z))*(1.-dot(a,a)),1e-7));}
float stripe(float f,float w){float aa=max(fwidth(f),.001);return 1.-smoothstep(w,w+aa,abs(f));}
float bands(float f,float w){return stripe(sin(f),w);}
vec3 pal(float t){t=t*colorScale+colorPhase;if(animatePalette>.5)t+=time*.035;t=fract(t);if(reversePalette>.5)t=1.-t;if(hardPalette>.5)t=min(floor(t*5.)/4.,1.);t*=4.;if(t<1.)return mix(c0,c1,t);if(t<2.)return mix(c1,c2,t-1.);if(t<3.)return mix(c2,c3,t-2.);return mix(c3,c4,t-3.);}
vec2 fold(vec2 z,out float parity,out float wall){
 float A=PI/p,B=PI/q;float cc=cos(B)/sqrt(max(cos(B)*cos(B)-sin(A)*sin(A),.0001));float rr=sqrt(cc*cc-1.);parity=0.;
 for(int i=0;i<48;i++){if(float(i)>=depth)break;float a=atan(z.y,z.x);float sector=floor((a+A)/(2.*A));a=mod(a+A,2.*A)-A;if(a<0.)parity+=1.;z=length(z)*vec2(cos(a),abs(sin(a)));vec2 v=z-vec2(cc,0.);float d=dot(v,v);if(d<rr*rr){z=vec2(cc,0.)+v*(rr*rr/max(d,1e-8));parity+=1.;}else break;}
 float den=max(1.-dot(z,z),.0001);float d0=abs(ash(2.*z.y/den));float d1=abs(ash(2.*(sin(A)*z.x-cos(A)*z.y)/den));float d2=abs(ash((dot(z-vec2(cc,0.),z-vec2(cc,0.))-rr*rr)/(rr*den)));wall=min(d2,min(d0,d1));return z/max(cc-rr,.01);
}
vec3 field(vec2 z,float t){
 float r=length(z),a=atan(z.y,z.x),rho=log((1.+r)/max(1.-r,.0001));vec2 l=z/max(r,.0001)*rho;float val=0.,line=0.,detail=0.;float w=.035*width;
 if(mode<.5){float parity,wall;vec2 f=fold(z,parity,wall);float ra=length(f),ang=atan(f.y,f.x);float flower=sin(ra*density*2.-t*.4+shape*cos(ang*p));val=ra*.28+parity*.071+flower*.11;line=stripe(wall,w)+.65*bands(flower,.09*width);detail=pow(.5+.5*cos(ang*p*2.+twist*ra),14.)*bands(ra*density*3.,.13*width);}
 else if(mode<1.5){float mn=100.,sum=0.;for(int i=0;i<16;i++){if(float(i)>=p)break;float an=TAU*float(i)/p+twist*.13;vec2 e=vec2(cos(an),sin(an));float b=log(max(1.-r*r,.00001)/max(dot(z-e,z-e),.00001));float v=sin(b*density-t*.65+phase*6.);mn=min(mn,abs(v));sum+=cos(b*density*.5+float(i)*.7);}val=sum/max(p,1.)*.35+rho*.12;line=stripe(mn,.07*width);detail=pow(max(0.,sin(sum*4.+shape*rho)),18.);}
 else if(mode<2.5){float x=ash(2.*z.x/max(1.-r*r,.0001)),y=ash(2.*z.y/max(1.-r*r,.0001));vec2 v=rot(twist*.2)*vec2(x,y);float sx=sin(v.x*density+t*.2),sy=sin(v.y*density-t*.2);float wx=bands(v.x*density,.12*width),wy=bands(v.y*density,.12*width);float over=step(0.,cos(v.x*density)*cos(v.y*density));val=.2+floor(v.x*density/PI)*.11+floor(v.y*density/PI)*.17;line=max(wx*(1.-wy*(1.-over)*.7),wy*(1.-wx*over*.7));detail=bands((v.x+v.y)*density*2.,.055*width)*(.4+.6*cos(sx*sy*shape));}
 else if(mode<3.5){vec2 v=rot(twist*.1)*l;float n=cos(p*v.x*.5)*cos(q*v.y*.5)-cos(q*v.x*.5)*cos(p*v.y*.5);n+=.22*sin(density*length(v)-t*.25);val=n*.18+rho*.14;line=stripe(n,.06*width);detail=bands(n*density+shape*sin(v.x-v.y),.045*width);}
 else if(mode<4.5){float d1=100.,d2=100.,id=0.;for(int i=0;i<32;i++){if(float(i)>=p+q)break;float fi=float(i);float an=fi*2.399963+phase;float rad=.16+.66*sqrt(fract(fi*.6180339+.13));vec2 c=rad*vec2(cos(an+sin(t*.13+fi)*twist*.07),sin(an+sin(t*.13+fi)*twist*.07));float d=hd(z,c);if(d<d1){d2=d1;d1=d;id=fi;}else d2=min(d2,d);}val=fract(id*.618)+d1*.055;line=stripe(d2-d1,.04*width);detail=bands(d1*density*2.-t*.4,.06*width)*pow(max(0.,1.-d1*.2),2.);}
 else if(mode<5.5){vec3 v=vec3(l*density,shape*sin(rho*1.6-t*.35));v.xy=rot(twist*.15)*v.xy;float gy=sin(v.x)*cos(v.y)+sin(v.y)*cos(v.z)+sin(v.z)*cos(v.x);float gy2=sin(v.y*1.7+t*.3)*cos(v.x*1.4)-cos(v.z+v.x);val=gy*.2+gy2*.15+rho*.08;line=bands(gy*2.+gy2*.6,.07*width);detail=stripe(gy2,.08*width)*(.5+.5*cos(gy*density));}
 else if(mode<6.5){float spiral=rho*density-a*p+twist*sin(rho*q-t*.25);float petals=sin(spiral)+shape*.25*cos(a*q+rho*3.);val=rho*.15+sin(spiral)*.12+a/TAU;line=stripe(petals,.07*width);detail=bands(rho*density*3.+a*q,.045*width)*pow(.5+.5*cos(spiral),6.);}
 else if(mode<7.5){float s=0.,h=0.;for(int i=0;i<20;i++){if(float(i)>=p)break;float fi=float(i),an=PI*fi/p;vec2 k=vec2(cos(an),sin(an));float proj=dot(l,k)*density;s+=cos(proj+shape*sin(fi*2.39996+t*.3+phase));h+=cos(proj*1.6180339-t*.2+twist*fi);}s/=sqrt(p);h/=sqrt(p);val=s*.14+h*.08+rho*.04;line=stripe(s+sin(h)*.5,.08*width);detail=bands(h*2.+s,.06*width);}
 else if(mode<8.5){float s=0.,h=0.;for(int i=0;i<6;i++){float fi=float(i),an=fi*TAU/6.;vec2 c=.46*vec2(cos(an+phase),sin(an+phase));vec2 m=mobius(z,c);float d=hd(z,c);float wave=d*density-p*.25*atan(m.y,m.x)-t+shape*sin(d*q*.5+fi);s+=sin(wave)/(1.+d*.4);h+=cos(wave*1.7+twist); }val=s*.12+rho*.06;line=bands(s*density,.09*width);detail=stripe(h,.08*width);}
 else {vec2 f=z*2.4;float trap=100.,acc=0.,der=1.;for(int i=0;i<20;i++){if(float(i)>=depth*.45)break;f=abs(f);if(f.x<f.y)f=f.yx;float inv=1.35/clamp(dot(f,f),.12+shape*.035,1.);f=f*inv-vec2(.83,.59);f=rot(twist*.1+t*.015)*f;der=der*inv+1.;trap=min(trap,abs(length(f)-.5)/max(sqrt(der),1.));acc+=exp(-abs(length(f)-.6)*density)/pow(1.3,float(i));}val=log(1.+der)*.06+acc*.13;line=stripe(trap,.008*width);detail=bands(acc*density,.055*width);}
 return vec3(val,clamp(line,0.,1.),clamp(detail,0.,1.));
}
void main(){
 vec2 uv=(2.*(gl_FragCoord.xy-viewportOrigin)-resolution)/min(resolution.x,resolution.y);vec2 z=uv/(.91*zoom);float r0=length(z),mask=1.-smoothstep(1.-2./min(resolution.x,resolution.y),1.,r0);vec3 bg=c0*.12;
 if(r0>=1.){gl_FragColor=vec4(bg,clamp(atlasOpacity,0.,1.));return;}
 if(projection>.5)z=z/(1.+sqrt(max(1.-dot(z,z),.000001)));
 float t=time*speed*motionOn;vec2 cen=center+drift*.23*vec2(sin(t*.13),cos(t*.11)-1.);float cr=length(cen);if(cr>.87)cen*=.87/cr;z=mobius(z,cen);z=rot(rotation+t*.025*drift)*z;float r=length(z);if(r>.997)z*=.997/r;
 vec3 f=field(z,t);vec3 ink=pal(f.x+phase);vec3 color=bg;
 if(fillOn>.5)color=mix(c0*.16,ink,.3+.7*(.5+.5*sin(f.x*TAU)));
 if(lineOn>.5)color=mix(color,pal(f.x+.32+phase)*1.15,f.y*.95);
 if(detailOn>.5)color=mix(color,pal(f.x+.65+phase),f.z*.75);
 if(haloOn>.5)color+=pal(f.x+.2+phase)*pow(f.y,.45)*glow*.4;
 if(embossOn>.5){float h=f.y*.7+f.z*.3+f.x*.2;vec3 n=normalize(vec3(-dFdx(h)*relief*60.,-dFdy(h)*relief*60.,1.));float light=.38+.68*max(dot(n,normalize(vec3(-.5,.7,1.))),0.);color*=light;color+=pow(max(dot(n,normalize(vec3(-.3,.4,1.))),0.),28.)*relief*.17;}
 if(edgeOn>.5){float edge=bands(log((1.+r)/max(1.-r,.0001))*8.,.04);color+=pal(.6)*edge*.13;}
 if(vignetteOn>.5)color*=1.-.42*pow(r0,4.);
 float lum=dot(color,vec3(.2126,.7152,.0722));color=mix(vec3(lum),color,saturation);color=max(color,0.);color=vec3(1.)-exp(-color*exposure);if(scanOn>.5)color*=.9+.1*sin(gl_FragCoord.y*PI);color+=(hash(gl_FragCoord.xy+phase*111.)-.5)*grain*.14;color=clamp(color,0.,1.);if(invertOn>.5)color=1.-color;color=mix(bg,color,mask);gl_FragColor=vec4(color,clamp(atlasOpacity,0.,1.));
}
