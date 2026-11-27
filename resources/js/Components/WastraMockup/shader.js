// Fragment shader: pemetaan kain ke badan & lengan, pencahayaan, anyaman, retakan malam, mask tepi.
// Di-generate dari versi HTML; ubah dengan hati-hati.
export const FRAGMENT_SHADER = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 uv;
uniform vec2 res,M,ey,exu,uLs,uLe,uLw,uRs,uRe,uRw;
uniform vec4 en;
uniform float shW,hipW,tilePx,rot,disp,yaw,refL,shadeK,crack;
uniform sampler2D tex,vid,msk;
// satu ruas lengan: (skor jarak, posisi sepanjang lengan px, posisi menyilang px)
vec4 seg(vec2 p,vec2 A,vec2 B,float rad){
  vec2 ab=B-A;float L=max(length(ab),1.);vec2 dir=ab/L;vec2 ap=p-A;
  float t=dot(ap,dir),tc=clamp(t,0.,L);
  float sc=length(ap-dir*tc)/rad+max(-t/L,0.)*3.;   // sebelum bahu dihukum agar dada tetap ikut peta badan
  return vec4(sc,t,dot(ap,vec2(-dir.y,dir.x)),L);
}
float lum(vec2 c){return dot(texture2D(vid,c).rgb,vec3(.3,.59,.11));}
vec2 h2(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}
float h1(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
float cell(vec2 p){vec2 i=floor(p),f=fract(p);float d1=9.,d2=9.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(float(x),float(y));float d=length(g+h2(i+g)-f);if(d<d1){d2=d1;d1=d;}else if(d<d2)d2=d;}
  return d2-d1;}
void main(){
  vec2 px=vec2(uv.x*res.x,(1.-uv.y)*res.y),d=px-M;
  float det=exu.x*ey.y-exu.y*ey.x;
  float a=(d.x*ey.y-d.y*ey.x)/det, b=(exu.x*d.y-exu.y*d.x)/det;
  float R=.5*mix(shW,hipW,clamp(b,0.,1.))/max(cos(yaw),.3);
  float sc=clamp(a/R,-.97,.97);
  vec2 q=vec2(R*(asin(sc)-yaw)+(a-R*sc), b*length(ey));
  // lengan baju: koordinat kain sendiri (silinder kecil sepanjang bahu-siku-pergelangan)
  float el0=shW/1.25,ra=.3*el0,rf=.25*el0;
  vec4 s0=seg(px,uLs,uLe,ra),s1=seg(px,uLe,uLw,rf),s2=seg(px,uRs,uRe,ra),s3=seg(px,uRe,uRw,rf);
  s0.x+=(1.-en.x)*9.;s1.x+=(1.-en.y)*9.;s2.x+=(1.-en.z)*9.;s3.x+=(1.-en.w)*9.;
  vec4 bs=s0;float off=0.,sd=-1.,rr=ra;
  if(s1.x<bs.x){bs=s1;off=length(uLe-uLs);sd=-1.;rr=rf;}
  if(s2.x<bs.x){bs=s2;off=0.;sd=1.;rr=ra;}
  if(s3.x<bs.x){bs=s3;off=length(uRe-uRs);sd=1.;rr=rf;}
  if(bs.x<1.15){float sa=clamp(bs.z/rr,-.97,.97);sc=sa;q=vec2(rr*asin(sa)+(bs.z-rr*sa)+sd*.4*tilePx,bs.y+off);}
  vec2 st=px/res,o=vec2(5.)/res;
  q+=disp*vec2(lum(st+vec2(o.x,0.))-lum(st-vec2(o.x,0.)), lum(st+vec2(0.,o.y))-lum(st-vec2(0.,o.y)));
  float c=cos(rot),s=sin(rot);
  vec2 qn=vec2(c*q.x-s*q.y,s*q.x+c*q.y)/tilePx;
  vec3 col=texture2D(tex,qn).rgb;
  // tepi baju: mask diperhalus lalu dipertajam
  vec2 m3=vec2(3.)/res;
  float m=(texture2D(msk,st).a*2.+texture2D(msk,st+vec2(m3.x,0.)).a+texture2D(msk,st-vec2(m3.x,0.)).a+texture2D(msk,st+vec2(0.,m3.y)).a+texture2D(msk,st-vec2(0.,m3.y)).a)/6.;
  float al=smoothstep(.3,.7,m);
  // pencahayaan: rasio terang baju asli terhadap rata-ratanya (bayangan, lipatan, kilap), berlaku untuk baju gelap maupun terang
  vec2 o2=vec2(2.)/res;
  float L=(lum(st)*2.+lum(st+vec2(o2.x,0.))+lum(st-vec2(o2.x,0.))+lum(st+vec2(0.,o2.y))+lum(st-vec2(0.,o2.y)))/6.;
  float rel=clamp(L/max(refL,.06),.3,2.);
  col*=mix(1.,pow(rel,1.1),shadeK);
  col+=smoothstep(1.2,1.8,rel)*.22*shadeK;
  col*=1.-.32*pow(abs(sc),3.);                      // sisi badan lebih gelap (kain melengkung)
  // serat anyaman
  vec2 tw=qn*64.;
  float fa=smoothstep(1.2,3.,tilePx/64.);
  col*=1.+fa*(.05*sin(tw.x*6.2832)*sin(tw.y*6.2832)+.07*(h1(floor(tw))-.5));
  // retakan malam khas batik
  float cr=1.-smoothstep(0.,.05,cell(qn*3.));
  col=mix(col,col*vec3(.55,.5,.45),cr*crack);
  gl_FragColor=vec4(col*al,al);
}`;
