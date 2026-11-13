// Reduced, compressible, substrate-friction active nematic with retained
// Hookean fiber chains. Not a full liquid-crystal or textile mechanics solver.
export const DEFAULT_PARAMS = Object.freeze({
  activity: 1.1, elasticity: 0.5, growth: 1, stiffness: 1.5,
  feedback: 0.65, nutrient: 0.8,
});
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const wrap = x => x - Math.floor(x);
const delta = x => x - Math.round(x);
const TAU = Math.PI * 2;
function randomSource(seed) {
  let a = seed >>> 0;
  return () => { a += 0x6D2B79F5; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

export class NematicSilkSimulation {
  constructor(size = 96, seed = 761236, params = {}, options = {}) {
    if (!Number.isInteger(size) || size < 16 || size > 256) throw new RangeError('Grid size must be an integer from 16 to 256.');
    this.size = size; this.params = { ...DEFAULT_PARAMS, ...params };
    this.maxFibers = clamp(Math.floor(options.maxFibers ?? size * .65), 1, 160);
    this.maxPoints = clamp(Math.floor(options.maxPoints ?? 120), 3, 240);
    const count = size * size;
    for (const name of ['q1','q2','vx','vy','sx','sy','density','n','next1','next2','nextN','rawX','rawY']) this[name] = new Float32Array(count);
    for (const name of ['left','right','up','down']) this[name] = new Int32Array(count);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = y * size + x;
      this.left[i] = y * size + (x + size - 1) % size; this.right[i] = y * size + (x + 1) % size;
      this.up[i] = (y + size - 1) % size * size + x; this.down[i] = (y + 1) % size * size + x;
    }
    this.reset(seed);
  }

  reset(seed = this.seed) {
    this.seed = seed >>> 0; this.time = 0; this.steps = 0;
    const rnd = this.random = randomSource(this.seed), modes = [];
    for (let k = 0; k < 14; k++) {
      let x = Math.floor(rnd() * 9) - 4, y = Math.floor(rnd() * 9) - 4;
      if (x === 0 && y === 0) x = 1;
      modes.push({ x, y, p: rnd() * TAU, q: rnd() * TAU, a: 1 / Math.sqrt(x * x + y * y) });
    }
    let energy = 0;
    for (let y = 0; y < this.size; y++) for (let x = 0; x < this.size; x++) {
      const i = y * this.size + x; let a = 0, b = 0;
      for (const m of modes) { const t = TAU * (m.x * x + m.y * y) / this.size; a += m.a * Math.cos(t + m.p); b += m.a * Math.cos(t + m.q); }
      this.q1[i] = a; this.q2[i] = b; energy += a * a + b * b;
    }
    const scale = .72 / Math.sqrt(energy / this.q1.length);
    for (let i = 0; i < this.q1.length; i++) {
      let a = this.q1[i] * scale, b = this.q2[i] * scale, s = Math.hypot(a,b);
      if (s > 1.15) { a *= 1.15/s; b *= 1.15/s; }
      this.q1[i] = a; this.q2[i] = b;
    }
    for (const name of ['vx','vy','sx','sy','density']) this[name].fill(0);
    this.n.fill(clamp(this.params.nutrient, 0, 1));
    this.fibers = []; this.detectDefects();
    for (let id = 0; id < this.maxFibers; id++) {
      const near = id < this.defects.length * 2 ? this.defects[id % this.defects.length] : null;
      const x = near ? wrap(near.x + (rnd() - .5) * .06) : rnd();
      const y = near ? wrap(near.y + (rnd() - .5) * .06) : rnd();
      const angle = .5 * Math.atan2(this.sample(this.q2,x,y),this.sample(this.q1,x,y)) + (id % 2 ? Math.PI : 0);
      const dx = Math.cos(angle), dy = Math.sin(angle), spacing = .65 / this.size, points = [];
      for (let j = 0; j < 3; j++) {
        const px = wrap(x + dx * spacing * j), py = wrap(y + dy * spacing * j);
        points.push({x:px, y:py, ax:px, ay:py, rest:j ? .65 : 0, tension:0});
      }
      const last = points[points.length - 1];
      this.fibers.push({ id, points, direction:[dx,dy], head:{x:last.x,y:last.y} });
    }
    this.depositFibers(); return this;
  }

  sample(field, u, v) {
    const size = this.size, px = wrap(u) * size, py = wrap(v) * size;
    const x = Math.floor(px), y = Math.floor(py), fx = px-x, fy = py-y;
    const r = (x+1) % size, d = (y+1) % size;
    return (field[y*size+x]*(1-fx)+field[y*size+r]*fx)*(1-fy)
      +(field[d*size+x]*(1-fx)+field[d*size+r]*fx)*fy;
  }

  step(count = 1) {
    const p = this.params, requested = Math.max(0,Math.floor(count));
    for (let s = 0; s < requested; s++) {
      this.advanceField(.04, p);
      this.advanceFibers(.04, p);
      this.depositFibers();
      this.steps++; this.time += .04;
      if (this.steps % 4 === 0) this.detectDefects();
    }
    return this;
  }

  advanceField(dt, p) {
    const {q1:a,q2:b,left:L,right:R,up:U,down:D,rawX:rx,rawY:ry,vx,vy,sx,sy,density,n,next1:na,next2:nb,nextN:nn,size} = this;
    const activity = clamp(p.activity,-2,2.5), K=clamp(p.elasticity,.1,1.4), feedback=clamp(p.feedback,0,2), targetN=clamp(p.nutrient,0,1);
    for (let i=0;i<a.length;i++) {
      const friction=1+2.8*density[i];
      rx[i]=activity*4*(.5*(a[R[i]]-a[L[i]])+.5*(b[D[i]]-b[U[i]]))/friction;
      ry[i]=activity*4*(.5*(b[R[i]]-b[L[i]])-.5*(a[D[i]]-a[U[i]]))/friction;
    }
    // Smooth substrate velocity before its derivatives enter alignment/rotation.
    for(let i=0;i<a.length;i++) {
      vx[i]=clamp((4*rx[i]+rx[L[i]]+rx[R[i]]+rx[U[i]]+rx[D[i]])/8,-3,3);
      vy[i]=clamp((4*ry[i]+ry[L[i]]+ry[R[i]]+ry[U[i]]+ry[D[i]])/8,-3,3);
    }
    for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
      const i=y*size+x,l=L[i],r=R[i],u=U[i],d=D[i];
      // Semi-Lagrangian advection is bounded; this is a compressible dry model.
      const aa=this.sample(a,(x-dt*vx[i])/size,(y-dt*vy[i])/size);
      const bb=this.sample(b,(x-dt*vx[i])/size,(y-dt*vy[i])/size);
      const order2=aa*aa+bb*bb, bulk=.85*(1-order2);
      const e1=.25*(vx[r]-vx[l]-vy[d]+vy[u]);
      const e2=.25*(vy[r]-vy[l]+vx[d]-vx[u]);
      const omega=.25*(vy[r]-vy[l]-vx[d]+vx[u]);
      // The signed stress is derived from spring strain, bounded for this
      // phenomenological alignment law; it is not an oriented-density proxy.
      const magnitude=Math.hypot(sx[i],sy[i]), stressScale=feedback/(1+magnitude);
      let qa=aa+dt*(bulk*aa+K*(a[l]+a[r]+a[u]+a[d]-4*a[i])+.48*e1+stressScale*sx[i]);
      let qb=bb+dt*(bulk*bb+K*(b[l]+b[r]+b[u]+b[d]-4*b[i])+.48*e2+stressScale*sy[i]);
      const angle=2*omega*dt, co=Math.cos(angle),si=Math.sin(angle), rotated=qa*co-qb*si;
      qb=qa*si+qb*co;qa=rotated;
      // Numerical guard for extreme user perturbations; equilibrium order≈1.
      const amp=Math.hypot(qa,qb);if(amp>1.3){qa*=1.3/amp;qb*=1.3/amp;}
      na[i]=qa;nb[i]=qb;
      nn[i]=clamp(n[i]+dt*(.20*(n[l]+n[r]+n[u]+n[d]-4*n[i])+.12*(targetN-n[i])),0,1);
    }
    [this.q1,this.next1]=[this.next1,this.q1];[this.q2,this.next2]=[this.next2,this.q2];[this.n,this.nextN]=[this.nextN,this.n];
  }

  advanceFibers(dt,p) {
    const size=this.size, k=clamp(p.stiffness,0,4), growth=clamp(p.growth,0,2), inv=1/size;
    for(const fiber of this.fibers) {
      const points=fiber.points;
      // The first node remains fixed. Deposited points retain weak substrate
      // anchors; differential flow stretches actual stored spring lengths.
      for(let j=1;j<points.length;j++) {
        const a=points[j], ux=this.sample(this.vx,a.x,a.y),uy=this.sample(this.vy,a.x,a.y);
        a.x=wrap(a.x+dt*.6*ux*inv-dt*.08*delta(a.x-a.ax));
        a.y=wrap(a.y+dt*.6*uy*inv-dt*.08*delta(a.y-a.ay));
      }
      for(let j=1;j<points.length;j++) {
        const a=points[j-1],b=points[j],dx=delta(b.x-a.x)*size,dy=delta(b.y-a.y)*size,L=Math.hypot(dx,dy);
        if(L<1e-6)continue;
        const strain=(L-b.rest)/Math.max(.05,b.rest),force=k*strain;
        const move=clamp(dt*.35*force,-.12,.12)*inv,xx=dx/L*move,yy=dy/L*move;
        if(j>1){a.x=wrap(a.x+xx*.5);a.y=wrap(a.y+yy*.5);}
        b.x=wrap(b.x-xx*.5);b.y=wrap(b.y-yy*.5);
      }
      const last=points[points.length-1];
      if(points.length>=this.maxPoints||growth===0){fiber.head.x=last.x;fiber.head.y=last.y;continue;}
      const head=fiber.head,qa=this.sample(this.q1,head.x,head.y),qb=this.sample(this.q2,head.x,head.y),order=Math.hypot(qa,qb);
      let angle=.5*Math.atan2(qb,qa),dx=Math.cos(angle),dy=Math.sin(angle);
      if(dx*fiber.direction[0]+dy*fiber.direction[1]<0){dx=-dx;dy=-dy;}
      const blend=clamp(order*.22,.025,.22);
      dx=fiber.direction[0]*(1-blend)+dx*blend;dy=fiber.direction[1]*(1-blend)+dy*blend;
      const norm=Math.hypot(dx,dy)||1;dx/=norm;dy/=norm;fiber.direction[0]=dx;fiber.direction[1]=dy;
      const nutrient=this.sample(this.n,head.x,head.y);
      // Low order marks defect cores; growth is enhanced near those cores.
      const speed=4.5*growth*nutrient*(1+.65*Math.exp(-order*order/.18));
      head.x=wrap(head.x+dt*(speed*dx+.25*this.sample(this.vx,head.x,head.y))*inv);
      head.y=wrap(head.y+dt*(speed*dy+.25*this.sample(this.vy,head.x,head.y))*inv);
      const length=Math.hypot(delta(head.x-last.x),delta(head.y-last.y))*size;
      if(length>=.48) {
        points.push({x:head.x,y:head.y,ax:head.x,ay:head.y,rest:length,tension:0});
        const ix=Math.floor(head.x*size),iy=Math.floor(head.y*size),i=iy*size+ix;
        this.n[i]=Math.max(0,this.n[i]-.035*length);
      }
    }
  }

  depositFibers() {
    const {density,sx,sy,size}=this,k=clamp(this.params.stiffness,0,4);
    density.fill(0);sx.fill(0);sy.fill(0);
    for(const fiber of this.fibers) {
      const pts=fiber.points;
      for(let j=1;j<pts.length;j++) {
        const a=pts[j-1],b=pts[j],dx=delta(b.x-a.x)*size,dy=delta(b.y-a.y)*size,L=Math.hypot(dx,dy);
        if(L<1e-6){b.tension=0;continue;}
        const tx=dx/L,ty=dy/L,strain=(L-b.rest)/Math.max(.05,b.rest),force=k*strain;
        b.tension=clamp(Math.abs(force)*8,0,1);
        const xx=wrap(a.x+.5*dx/size)*size,yy=wrap(a.y+.5*dy/size)*size,x=Math.floor(xx),y=Math.floor(yy),fx=xx-x,fy=yy-y;
        const indices=[y*size+x,y*size+(x+1)%size,((y+1)%size)*size+x,((y+1)%size)*size+(x+1)%size];
        const weights=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy];
        for(let v=0;v<4;v++) {
          const i=indices[v],w=weights[v]*L;
          density[i]+=.30*w;
          // Length-weighted traceless virial-like stress in lattice units.
          sx[i]+=force*(tx*tx-ty*ty)*w*2;sy[i]+=force*2*tx*ty*w*2;
        }
      }
    }
    for(let i=0;i<density.length;i++)density[i]=Math.min(1,density[i]);
  }

  detectDefects() {
    const {size,q1:a,q2:b,right:R,down:D}=this,defects=[];
    const phase=(i,j)=>{let d=Math.atan2(b[j],a[j])-Math.atan2(b[i],a[i]);if(d>Math.PI)d-=TAU;if(d< -Math.PI)d+=TAU;return d;};
    for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
      const i=y*size+x,r=R[i],d=D[i],rd=D[r];
      const winding=(phase(i,r)+phase(r,rd)+phase(rd,d)+phase(d,i))/TAU;
      if(Math.abs(winding)>.5)defects.push({x:(x+.5)/size,y:(y+.5)/size,charge:winding>0?.5:-.5});
    }
    this.defects=defects;return defects;
  }

  inject(u,v,mode='stir') {
    u=wrap(u);v=wrap(v);const radius=.055;
    for(let y=0;y<this.size;y++)for(let x=0;x<this.size;x++) {
      const dx=delta(x/this.size-u),dy=delta(y/this.size-v),r2=(dx*dx+dy*dy)/(radius*radius);
      if(r2>9)continue;
      const i=y*this.size+x,w=Math.exp(-r2*1.5);
      if(mode==='feed')this.n[i]+=(1-this.n[i])*.9*w;
      else if(mode==='melt'){this.q1[i]*=1-.85*w;this.q2[i]*=1-.85*w;}
      else {
        const a=this.q1[i],b=this.q2[i],angle=1.25*w,co=Math.cos(angle),si=Math.sin(angle);
        this.q1[i]=a*co-b*si;this.q2[i]=a*si+b*co;
      }
    }
    this.detectDefects();return this;
  }

  stats() {
    let meanStress=0,meanOrder=0,nutrientMean=0,segments=0;
    for(let i=0;i<this.q1.length;i++){meanStress+=Math.hypot(this.sx[i],this.sy[i]);meanOrder+=Math.hypot(this.q1[i],this.q2[i]);nutrientMean+=this.n[i];}
    for(const f of this.fibers)segments+=f.points.length-1;
    const count=this.q1.length;
    return {time:this.time,steps:this.steps,defectsPositive:this.defects.filter(d=>d.charge>0).length,defectsNegative:this.defects.filter(d=>d.charge<0).length,
      fiberCount:this.fibers.length,segments,meanStress:meanStress/count,meanOrder:meanOrder/count,nutrientMean:nutrientMean/count,seed:this.seed,size:this.size};
  }

  encode(target=new Uint8Array(this.q1.length*4)) {
    if(target.length!==this.q1.length*4)throw new RangeError('RGBA target size does not match grid.');
    for(let i=0;i<this.q1.length;i++) {
      target[i*4]=Math.round(clamp((this.q1[i]+1.5)/3,0,1)*255);target[i*4+1]=Math.round(clamp((this.q2[i]+1.5)/3,0,1)*255);
      target[i*4+2]=Math.round(clamp(Math.hypot(this.sx[i],this.sy[i])*2,0,1)*255);target[i*4+3]=Math.round(this.density[i]*255);
    }
    return target;
  }
}
