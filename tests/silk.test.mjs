import test from 'node:test';
import assert from 'node:assert/strict';
import { NematicSilkSimulation } from '../experiments/disclination-silk/simulation.js';

test('nematic state, detected defects and retained fibers are deterministic',()=>{
  const a=new NematicSilkSimulation(32,523),b=new NematicSilkSimulation(32,523);
  assert.ok(a.defects.length>0);
  assert.equal(a.defects.reduce((sum,d)=>sum+d.charge,0),0,'periodic net charge is zero');
  a.step(20);b.step(20);
  assert.deepEqual(a.q1,b.q1);assert.deepEqual(a.fibers,b.fibers);
  assert.equal(a.encode().length,32*32*4);
});

test('defects evolve and fibers grow as retained geometry',()=>{
  const sim=new NematicSilkSimulation(32,523),defects=JSON.stringify(sim.defects),count=sim.stats().segments;
  const first=sim.fibers[0],anchor={x:first.points[0].x,y:first.points[0].y};
  sim.step(100);
  assert.notEqual(JSON.stringify(sim.defects),defects,'defects are detected in evolved Q, not prescribed trajectories');
  assert.ok(sim.stats().segments>count);
  assert.deepEqual({x:first.points[0].x,y:first.points[0].y},anchor,'the deposited root remains anchored');
  assert.ok(sim.stats().meanStress>1e-5,'differential flow strains actual springs');
});

test('Hookean stress is zero at birth, depends on extension, and can reorient Q',()=>{
  const sim=new NematicSilkSimulation(32,44,{growth:0,activity:0});
  assert.ok(sim.stats().meanStress<1e-6);
  const fiber=sim.fibers[0];fiber.points[1].x+=.012;
  sim.depositFibers();assert.ok(sim.stats().meanStress>1e-5);
  sim.params.stiffness=0;sim.depositFibers();assert.equal(sim.stats().meanStress,0);
  const withFeedback=new NematicSilkSimulation(32,27,{feedback:2}),without=new NematicSilkSimulation(32,27,{feedback:0});
  withFeedback.step(100);without.step(100);
  const difference=withFeedback.q1.reduce((sum,q,i)=>sum+Math.abs(q-without.q1[i]),0);
  assert.ok(difference>.01,'computed fiber stress changes stored nematic state');
});

test('extreme UI settings remain finite and memory is bounded',()=>{
  const sim=new NematicSilkSimulation(24,9,{activity:2.5,elasticity:1.4,growth:2,stiffness:4,feedback:2,nutrient:1},{maxFibers:12,maxPoints:24});
  sim.step(300);sim.inject(.3,.2,'melt');sim.inject(.4,.7,'stir');sim.step(100);
  for(const name of ['q1','q2','vx','vy','sx','sy','density','n'])for(const value of sim[name])assert.ok(Number.isFinite(value),name);
  for(let i=0;i<sim.q1.length;i++)assert.ok(Math.hypot(sim.q1[i],sim.q2[i])<=1.300001);
  assert.ok(sim.fibers.every(f=>f.points.length<=24));
  for(const f of sim.fibers)for(const point of f.points)assert.ok(point.x>=0&&point.x<1&&point.y>=0&&point.y<1&&point.tension>=0&&point.tension<=1);
});

test('growth consumes supply and feeding modifies persistent nutrient',()=>{
  const sim=new NematicSilkSimulation(32,54,{growth:2,nutrient:1});
  sim.step(30);const before=sim.stats().nutrientMean;
  assert.ok(before<1);
  sim.inject(sim.fibers[0].head.x,sim.fibers[0].head.y,'feed');
  assert.ok(sim.stats().nutrientMean>before);
});

test('zero growth retains existing fibers without inserting new material',()=>{
  const sim=new NematicSilkSimulation(24,18,{growth:0,activity:2});
  const count=sim.stats().segments;
  sim.step(60);
  assert.equal(sim.stats().segments,count);
  assert.ok(sim.stats().meanStress>0,'retained fibers can still deform');
});
