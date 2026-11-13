// Native WebGL 1: field optics and actual retained spring-chain ribbons.
export const fieldVertex = `
attribute vec2 aPosition;
void main(){gl_Position=vec4(aPosition,0.,1.);}`;

export const fieldFragment = `
precision highp float;
uniform sampler2D uState,uPalette;
uniform vec2 uResolution;
uniform vec4 uPatch;
uniform float uPolarizer,uSource,uView,uGrid;
const float PI=3.14159265359;
vec3 spectral(float path){return .5+.5*cos(6.2831853*path/vec3(650.,510.,440.));}
void main(){
 vec2 uv=(gl_FragCoord.xy-uPatch.xy)/uPatch.zw;
 vec2 centered=(gl_FragCoord.xy/uResolution-.5)*vec2(uResolution.x/uResolution.y,1.);
 vec3 bg=vec3(.018,.026,.040)+vec3(.012,.018,.021)*max(0.,1.-length(centered));
 if(min(min(uv.x,uv.y),min(1.-uv.x,1.-uv.y))<0.){gl_FragColor=vec4(bg,1.);return;}
 vec4 s=texture2D(uState,uv);vec2 q=s.rg*3.-1.5;
 float order=clamp(length(q),0.,1.5),theta=.5*atan(q.y,q.x);
 float crossed=pow(sin(2.*(theta-uPolarizer)),2.);
 vec3 film=spectral((150.+520.*order+950.*s.b+180.*s.a));
 vec3 pal=texture2D(uPalette,vec2(fract(theta/PI+.55+s.b*.22),.5)).rgb;
 vec3 polarization=mix(pal,film,uSource*.84)*crossed;
 float border=smoothstep(0.,.045,min(min(uv.x,uv.y),min(1.-uv.x,1.-uv.y)));
 float vignette=1.-smoothstep(.25,.70,length(uv-.5));
 vec3 color=bg+polarization*(.15+.19*s.a)*vignette;
 // Each microscopic line is a local director glyph sampled from retained Q,
 // not an advected noise texture or an invented fiber centerline.
 float cells=uView>.5&&uView<1.5?34.:76.;
 vec2 cell=(floor(uv*cells)+.5)/cells;
 vec2 qc=texture2D(uState,cell).rg*3.-1.5;
 float angle=.5*atan(qc.y,qc.x);vec2 axis=vec2(cos(angle),sin(angle));
 vec2 local=(uv-cell)*cells;
 float along=dot(local,axis),across=dot(local,vec2(-axis.y,axis.x));
 float glyph=(1.-smoothstep(.015,.055,abs(across)))*(1.-smoothstep(.30,.42,abs(along)))*smoothstep(.12,.6,length(qc));
 if(uView<.5)color+=mix(vec3(.13,.24,.24),pal,.4)*glyph*.12*vignette;
 else if(uView<1.5)color=bg+pal*(.06+.66*glyph)*border;
 else{
  vec3 stress=mix(vec3(.025,.08,.13),vec3(.98,.22,.12),smoothstep(0.,.65,s.b));
  stress=mix(stress,vec3(1.,.91,.52),smoothstep(.3,1.,s.b));
  color=bg+stress*(.22+.72*s.b)*border;
  color+=vec3(.16,.39,.43)*glyph*.13;
 }
 color=mix(bg,color,border);
 gl_FragColor=vec4(color,1.);
}`;

export const ribbonVertex = `
attribute vec2 aPosition,aNormal;
attribute float aSide,aTension,aPigment,aArc,aWidth;
uniform vec2 uResolution;
uniform vec4 uPatch;
varying mediump vec2 vMaterial;
varying mediump float vSide,vTension,vPigment,vArc;
void main(){
 vec2 pixel=uPatch.xy+aPosition*uPatch.zw+aNormal*aSide*aWidth;
 gl_Position=vec4(pixel/uResolution*2.-1.,0.,1.);
 vMaterial=aPosition;vSide=aSide;vTension=aTension;vPigment=aPigment;vArc=aArc;
}`;

export const ribbonFragment = `
precision highp float;
uniform sampler2D uState,uPalette;
uniform float uPolarizer,uSource,uView;
varying mediump vec2 vMaterial;
varying mediump float vSide,vTension,vPigment,vArc;
const float PI=3.14159265359;
void main(){
 float side=clamp(vSide,-1.,1.),roundness=sqrt(max(0.,1.-side*side));
 vec4 s=texture2D(uState,clamp(vMaterial,vec2(0.),vec2(1.)));
 vec2 q=s.rg*3.-1.5;float theta=.5*atan(q.y,q.x);
 float tension=clamp(vTension,0.,1.);
 float phase=fract(vPigment+tension*.18+s.b*.19+theta*.12);
 vec3 pal=texture2D(uPalette,vec2(phase,.5)).rgb;
 float optical=250.+tension*260.+s.b*480.+roundness*160.;
 vec3 film=.5+.5*cos(4.*PI*optical/vec3(650.,510.,440.));
 vec3 base=mix(pal,film,uSource*.70);
 float illumination=.25+.66*roundness;
 float highlight=pow(max(0.,roundness*.85-side*.48),26.);
 float secondary=pow(max(0.,roundness*.62+side*.66),38.);
 float fibrils=.86+.14*pow(.5+.5*cos(side*PI*3.+vArc*2.),3.);
 float crossed=.40+.60*pow(sin(2.*(theta-uPolarizer)),2.);
 vec3 color=base*illumination*fibrils*crossed;
 color+=vec3(.83,.98,.94)*highlight*.82+vec3(.34,.24,.63)*secondary*.65;
 color+=film*pow(1.-roundness,3.)*.33;
 if(uView>1.5)color=mix(vec3(.12,.42,.48),vec3(1.,.77,.29),tension)*(.45+.6*roundness)+highlight*.5;
 float border=smoothstep(0.,.025,min(min(vMaterial.x,vMaterial.y),min(1.-vMaterial.x,1.-vMaterial.y)));
 float alpha=(1.-smoothstep(.82,1.,abs(side)))*border*(uView>.5&&uView<1.5?.28:.92);
 gl_FragColor=vec4(color,alpha);
}`;

export const defectVertex = `
attribute vec2 aPosition;
attribute float aCharge;
uniform vec2 uResolution;
uniform vec4 uPatch;
varying mediump float vCharge;
void main(){gl_Position=vec4((uPatch.xy+aPosition*uPatch.zw)/uResolution*2.-1.,0.,1.);gl_PointSize=13.;vCharge=aCharge;}`;

export const defectFragment = `
precision mediump float;
varying mediump float vCharge;
void main(){
 vec2 p=gl_PointCoord-.5;float radius=length(p);
 float ring=(1.-smoothstep(.032,.075,abs(radius-.35)));
 float sign=(1.-smoothstep(.035,.08,abs(p.y)))*(1.-smoothstep(.18,.23,abs(p.x)));
 if(vCharge>0.)sign=max(sign,(1.-smoothstep(.035,.08,abs(p.x)))*(1.-smoothstep(.18,.23,abs(p.y))));
 float a=max(ring*.7,sign);
 gl_FragColor=vec4(vCharge>0.?vec3(.98,.62,.37):vec3(.49,.80,1.),a);
}`;
