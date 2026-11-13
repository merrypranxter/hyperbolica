import test from 'node:test';
import assert from 'node:assert/strict';
import { SpinodalSimulation } from '../experiments/spinodal-reliquary/simulation.js';

const sum = a => a.reduce((total, v) => total + v, 0);

test('periodic phase flux conserves concentration with spatial mineral barriers', () => {
  const sim = new SpinodalSimulation(24, 42);
  for (let i = 0; i < sim.s.length; i++) sim.s[i] = (i % 13) / 14;
  const before = sim.stats().mean;
  sim.step(150);
  assert.ok(Math.abs(sim.stats().mean - before) < 2e-6);
  assert.ok(sim.stats().max > 0.5 && sim.stats().min < -0.5, 'warm start contains separated domains');
});

test('seed and structural evolution are deterministic and perturbation preserves mean', () => {
  const a = new SpinodalSimulation(24, 91), b = new SpinodalSimulation(24, 91);
  a.step(12); b.step(12);
  assert.deepEqual(a.c, b.c); assert.deepEqual(a.s, b.s);
  const before = a.stats().mean;
  a.inject(0.99, 0.01, 'quench');
  assert.ok(Math.abs(a.stats().mean - before) < 2e-7);
  assert.notDeepEqual(a.c, b.c);
  assert.equal(a.encode().length, 24 * 24 * 4);
});

test('precipitation consumes nutrient and optical history survives dissolution', () => {
  const sim = new SpinodalSimulation(24, 42, { mineralRate: 0.4, feed: 0 });
  const nutrientBefore = sum(sim.n);
  sim.step(100);
  assert.ok(sum(sim.s) > 1, 'interfaces precipitate');
  assert.ok(sum(sim.n) < nutrientBefore, 'nutrient is consumed');
  assert.ok(Math.abs(sum(sim.n) + 0.8 * sum(sim.s) - nutrientBefore) < 0.002, 'closed precipitation mass balance');
  const history = sim.h.slice(), mineral = sum(sim.s);
  sim.params.mineralRate = 0; sim.params.dissolve = 1;
  sim.step(60);
  assert.ok(sum(sim.s) < mineral * 0.5);
  assert.deepEqual(sim.h, history, 'fossil history remains after material dissolves');
});

test('mineral causally arrests phase motion, rather than merely coloring it', () => {
  const free = new SpinodalSimulation(24, 63, { mineralRate: 0 }), arrested = new SpinodalSimulation(24, 63, { mineralRate: 0 });
  const initial = free.c.slice(); arrested.s.fill(1);
  free.step(80); arrested.step(80);
  const displacement = sim => sim.c.reduce((acc, c, i) => acc + Math.abs(c - initial[i]), 0);
  assert.ok(displacement(arrested) < displacement(free) * 0.2);
});

test('highest UI parameters remain finite and chemical channels stay bounded', () => {
  const sim = new SpinodalSimulation(24, 78, { quench: 1.8, kappa: 0.6, mobility: 1.5, anisotropy: 0.8, mineralRate: 0.3, feed: 0.12 });
  sim.step(120); sim.inject(0.4, 0.3, 'feed'); sim.inject(0.2, 0.7, 'dissolve'); sim.step(20);
  for (const value of sim.c) assert.ok(Number.isFinite(value) && Math.abs(value) < 1.5);
  for (const channel of [sim.s, sim.n, sim.h]) for (const value of channel) assert.ok(Number.isFinite(value) && value >= 0 && value <= 1);
});
