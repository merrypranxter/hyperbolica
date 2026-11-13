// Dimensionless, finite-difference Cahn–Hilliard / precipitation art model.
// This is a persistent conservative phase field, not a calibrated mineral solver.
export const DEFAULT_PARAMS = Object.freeze({
  quench: 1, kappa: 1.1, mobility: 1, mineralRate: 0.022,
  feed: 0.04, dissolve: 0, anisotropy: 0.25, mean: -0.12,
});

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function rng(seed) {
  let x = seed >>> 0;
  return () => { x += 0x6D2B79F5; let t = x; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export class SpinodalSimulation {
  constructor(size = 160, seed = 761235, params = {}, options = {}) {
    if (!Number.isInteger(size) || size < 16 || size > 512) throw new RangeError('Simulation size must be an integer from 16 to 512.');
    this.size = size;
    this.params = { ...DEFAULT_PARAMS, ...params };
    const count = size * size;
    for (const name of ['c', 's', 'n', 'h', 'mu', 'cNext', 'sNext', 'nNext', 'hNext', 'mob']) this[name] = new Float32Array(count);
    this.left = new Int32Array(count); this.right = new Int32Array(count);
    this.up = new Int32Array(count); this.down = new Int32Array(count);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = y * size + x;
      this.left[i] = y * size + (x + size - 1) % size;
      this.right[i] = y * size + (x + 1) % size;
      this.up[i] = ((y + size - 1) % size) * size + x;
      this.down[i] = ((y + 1) % size) * size + x;
    }
    this.warmupSteps = options.warmupSteps ?? 600;
    this.reset(seed);
  }

  reset(seed = this.seed) {
    this.seed = seed >>> 0;
    const random = rng(this.seed), { size, c, s, n, h } = this;
    this.time = 0; this.steps = 0;
    s.fill(0); n.fill(0.86); h.fill(0);
    // A quenched initial perturbation, not frame-by-frame random forcing.
    for (let i = 0; i < c.length; i++) c[i] = random() * 2 - 1;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < c.length; i++) this.cNext[i] = (4 * c[i] + c[this.left[i]] + c[this.right[i]] + c[this.up[i]] + c[this.down[i]]) / 8;
      c.set(this.cNext);
    }
    let mean = 0; for (let i = 0; i < c.length; i++) mean += c[i]; mean /= c.length;
    for (let i = 0; i < c.length; i++) c[i] = this.params.mean + 0.32 * (c[i] - mean);
    // Warm only the separation dynamics so the specimen opens with visible pores.
    // Preconditioning changes the state; mineral/nutrient/history start pristine.
    for (let i = 0; i < this.warmupSteps; i++) this.advance(0.025, false);
    this.time = 0; this.steps = 0;
    return this;
  }

  step(count = 1) {
    const requested = Math.max(0, Math.floor(count));
    for (let i = 0; i < requested; i++) this.advance(0.025, true);
    this.steps += requested;
    this.time += requested * 0.025;
    return this;
  }

  advance(duration, chemistry) {
    const p = this.params;
    const quench = clamp(p.quench, 0.3, 1.8), kappa = clamp(p.kappa, 0.6, 1.8);
    const mobility = clamp(p.mobility, 0, 1.5), anisotropy = clamp(p.anisotropy, 0, 0.8);
    // For the explicit fourth-order operator, dt scales with the highest grid
    // eigenvalue. This conservative bound also allows |c| modestly above 1.
    const bound = 8 * mobility * (1 + anisotropy) * (6.75 + quench) + 64 * mobility * (1 + anisotropy) * kappa;
    const splits = Math.max(1, Math.ceil(duration * Math.max(bound, 28) / 1.6));
    const dt = duration / splits;
    const L = this.left, R = this.right, U = this.up, D = this.down;
    for (let part = 0; part < splits; part++) {
      const { c, s, n, h, mu, mob, cNext, sNext, nNext, hNext } = this;
      for (let i = 0; i < c.length; i++) {
        const value = c[i], lap = c[L[i]] + c[R[i]] + c[U[i]] + c[D[i]] - 4 * value;
        mu[i] = value * value * value - quench * value - kappa * lap;
        mob[i] = mobility * (0.025 + 0.975 * (1 - s[i]) ** 3);
      }
      const dx = 1 + anisotropy, dy = 1 - anisotropy;
      for (let i = 0; i < c.length; i++) {
        const l = L[i], r = R[i], u = U[i], d = D[i], m = mob[i], chem = mu[i];
        // Symmetric face conductances make pairwise fluxes cancel exactly in
        // real arithmetic, conserving the mean even with inhomogeneous mineral.
        const flux = dx * (0.5 * (m + mob[l]) * (mu[l] - chem) + 0.5 * (m + mob[r]) * (mu[r] - chem))
          + dy * (0.5 * (m + mob[u]) * (mu[u] - chem) + 0.5 * (m + mob[d]) * (mu[d] - chem));
        cNext[i] = c[i] + dt * flux; // No concentration clamp: preserve conservation.
        if (!chemistry) continue;
        const permeability = 1 - 0.92 * s[i], ni = n[i];
        const nutrientFlux = 3.5 * (
          (1 - 0.46 * (s[i] + s[l])) * (n[l] - ni) + (1 - 0.46 * (s[i] + s[r])) * (n[r] - ni)
          + (1 - 0.46 * (s[i] + s[u])) * (n[u] - ni) + (1 - 0.46 * (s[i] + s[d])) * (n[d] - ni));
        const available = clamp(ni + dt * (nutrientFlux + Math.max(0, p.feed) * permeability * (1 - ni)), 0, 1);
        const gx = 0.5 * (c[r] - c[l]), gy = 0.5 * (c[d] - c[u]);
        const interfacial = Math.max(0, 1 - c[i] * c[i]) ** 2 * smooth(0.025, 0.18, Math.hypot(gx, gy));
        const precipitation = Math.min(1 - s[i], available / 0.8,
          dt * Math.max(0, p.mineralRate) * available * interfacial * (1 - s[i]));
        const dissolution = Math.min(s[i], dt * Math.max(0, p.dissolve) * s[i]);
        sNext[i] = clamp(s[i] + precipitation - dissolution, 0, 1);
        nNext[i] = clamp(available - 0.8 * precipitation + 0.8 * dissolution, 0, 1);
        hNext[i] = Math.min(1, h[i] + 0.7 * precipitation); // Positive-only optical fossil memory.
      }
      [this.c, this.cNext] = [this.cNext, this.c];
      if (chemistry) {
        [this.s, this.sNext] = [this.sNext, this.s];
        [this.n, this.nNext] = [this.nNext, this.n];
        [this.h, this.hNext] = [this.hNext, this.h];
      }
    }
  }

  inject(u, v, mode = 'feed') {
    u = ((u % 1) + 1) % 1; v = ((v % 1) + 1) % 1;
    const { size, c, s, n } = this, radius = 0.045;
    let perturbation = 0;
    const delta = mode === 'quench' ? new Float32Array(c.length) : null;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      let dx = x / size - u, dy = y / size - v;
      dx -= Math.round(dx); dy -= Math.round(dy);
      const r2 = (dx * dx + dy * dy) / (radius * radius);
      if (r2 > 9) continue;
      const i = y * size + x, weight = Math.exp(-2 * r2);
      if (mode === 'feed') n[i] += (1 - n[i]) * 0.8 * weight;
      else if (mode === 'dissolve') s[i] *= 1 - 0.8 * weight;
      else if (delta) { delta[i] = 0.11 * weight * Math.sin(dx / radius * 3); perturbation += delta[i]; }
    }
    if (delta) { const correction = perturbation / c.length; for (let i = 0; i < c.length; i++) c[i] += delta[i] - correction; }
    return this;
  }

  stats() {
    let mean = 0, mineralFraction = 0, nutrientMean = 0, historyMean = 0, phaseFraction = 0, min = Infinity, max = -Infinity;
    for (let i = 0; i < this.c.length; i++) {
      const value = this.c[i]; mean += value; min = Math.min(min, value); max = Math.max(max, value);
      mineralFraction += this.s[i]; nutrientMean += this.n[i]; historyMean += this.h[i]; phaseFraction += value > 0 ? 1 : 0;
    }
    const count = this.c.length;
    return { mean: mean / count, mineralFraction: mineralFraction / count, nutrientMean: nutrientMean / count,
      historyMean: historyMean / count, phaseFraction: phaseFraction / count, min, max, steps: this.steps, time: this.time, seed: this.seed, size: this.size };
  }

  encode(target = new Uint8Array(this.c.length * 4)) {
    if (target.length !== this.c.length * 4) throw new RangeError('RGBA target size does not match simulation grid.');
    for (let i = 0; i < this.c.length; i++) {
      const o = i * 4;
      target[o] = Math.round(clamp((this.c[i] + 1.5) / 3, 0, 1) * 255);
      target[o + 1] = Math.round(this.s[i] * 255); target[o + 2] = Math.round(this.n[i] * 255); target[o + 3] = Math.round(this.h[i] * 255);
    }
    return target;
  }
}
