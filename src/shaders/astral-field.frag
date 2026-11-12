precision highp float;
        varying vec2 vUv;

        uniform vec2  uResolution;
        uniform float uTime;
        uniform vec2  uMouse;
        uniform float uZoom;

        uniform float uEngineMorph;   // 0.0=Calabi-Yau, 1.0=Turing-Physarum, 2.0=Crop-Circle Zeta, 3.0=Hopf Ferro-Foam
        uniform float uSymmetry;      // 3 .. 24
        uniform float uOctaves;       // 2 .. 10
        uniform float uTwist;         // 0.0 .. 5.0
        uniform float uDensity;       // 1.0 .. 30.0
        uniform float uGloss;         // 0.0 .. 3.0
        uniform float uAcid;          // 0.5 .. 3.5
        uniform float uContourCarve;  // 0.1 .. 2.0
        uniform float uHalftoneMix;   // 0.0 .. 1.0
        uniform float uGlitch;        // 0.0 .. 1.5
        uniform sampler2D u_palette;
        uniform float uPalettePhase;
        uniform float uChromaLock;
        uniform float uAstralOpacity;
        uniform float uAstralQuality;

        #define PI  3.14159265359
        #define TAU 6.28318530718
        #define PHI 1.61803398875

        // -------------------------------------------------------------------
        // 1. HARDWARE-SAFE MATHEMATICAL GUARDS (ZERO NaN / ZERO INFINITY)
        // -------------------------------------------------------------------
        float safePow(float base, float expVal) {
            return pow(max(abs(base), 1e-5), expVal);
        }

        float safeAtan(float y, float x) {
            float safeX = (abs(x) + abs(y) < 1e-6) ? 1e-6 : x;
            return atan(y, safeX);
        }

        vec3 safeTanh3(vec3 x) {
            vec3 c = clamp(x, 0.0, 10.0);
            return c * (27.0 + c * c) / (27.0 + 9.0 * c * c);
        }

        mat2 rot2(float a) {
            float s = sin(a), c = cos(a);
            return mat2(c, -s, s, c);
        }

        float hash12(vec2 p) {
            vec3 p3 = fract(vec3(p.xyx) * 0.1031);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        vec2 hash22(vec2 p) {
            vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973));
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.xx + p3.yz) * p3.zy);
        }

        // Smooth Minimum for organic ferrofluid & soap-bubble fusion
        float smin(float a, float b, float k) {
            float h = clamp(0.5 + 0.5 * (b - a) / max(k, 1e-4), 0.0, 1.0);
            return mix(b, a, h) - k * h * (1.0 - h);
        }

        // N-Fold Dihedral Kaleidoscope Folding
        vec2 foldDihedral(vec2 p, float nSides) {
            float r = length(p);
            float a = safeAtan(p.y, p.x);
            float sector = TAU / clamp(nSides, 3.0, 24.0);
            a = mod(a + 0.5 * sector, sector) - 0.5 * sector;
            a = sqrt(a * a + 1e-5);
            return vec2(cos(a), sin(a)) * r;
        }

        // -------------------------------------------------------------------
        // 2. 5 SELECTABLE DARK-GROUND NEON INK PALETTES
        // -------------------------------------------------------------------
        vec3 evaluateNeonPalette(float phase) {
            return texture2D(u_palette,vec2(fract(phase+uPalettePhase),0.5)).rgb;
        }

                // -------------------------------------------------------------------
        // 3. CRITICAL ANTI-WHITEOUT / DARK-GROUND NEON LOCK
        // -------------------------------------------------------------------
        vec3 lockAcidNeon(vec3 col, float overdrive, float contrastCarve) {
            // 1. Scrub any invalid/negative numbers
            vec3 c = clamp(col, 0.0, 12.0);
            if (!(c.r >= 0.0 && c.r <= 12.0)) c.r = 0.0;
            if (!(c.g >= 0.0 && c.g <= 12.0)) c.g = 0.0;
            if (!(c.b >= 0.0 && c.b <= 12.0)) c.b = 0.0;

            // 2. Suppress the achromatic white floor so R, G, B NEVER all hit 1.0 simultaneously
            float minCh = min(c.r, min(c.g, c.b));
            c = max(c - minCh * 0.84, vec3(0.0));

            // 3. Peak-channel normalization + chroma power curve
            float peak = max(c.r, max(c.g, max(c.b, 1e-4)));
            vec3 pureHue = c / peak;
            pureHue = vec3(
                safePow(pureHue.r, 1.18),
                safePow(pureHue.g, 1.18),
                safePow(pureHue.b, 1.18)
            );

            // 4. Bounded rational saturation + dark obsidian contour carving
            float amp = (1.0 - exp(-peak * overdrive * 1.15));
            vec3 locked = safeTanh3(pureHue * amp * (0.95 + 0.35 * overdrive));

            // Blend with deep obsidian void (#04010a) along structural contour boundaries
            vec3 obsidianVoid = vec3(0.016, 0.004, 0.04);
            return mix(obsidianVoid, locked, clamp(contrastCarve, 0.0, 1.0));
        }

        // -------------------------------------------------------------------
        // ENGINE 01: CALABI-YAU 6D QUINTIC & WEIERSTRASS ELLIPTIC LATTICE
        // Returns vec4(height, phaseMetric, contourSignal, microDetail)
        // -------------------------------------------------------------------
        vec4 evalEngine01_CalabiYau(vec2 p, float t) {
            // Fold coordinate into N-fold dihedral symmetry + interactive Mobius pole
            vec2 z = p - uMouse * 0.45;
            float r0 = length(z) + 1e-4;
            z = foldDihedral(z, uSymmetry);

            // Complex-plane Weierstrass Elliptic Lattice & Quintic Fermat Sheet Projection
            float nExp = clamp(floor(uSymmetry * 0.5 + 2.0), 3.0, 9.0);
            float scale = 1.6 + uDensity * 0.14;
            vec2 w = z * scale;

            float sheetAccum = 0.0;
            float branchPhase = 0.0;
            float ribbonEdge = 1e4;
            float maxSheets = clamp(uOctaves, 2.0, 8.0);

            for (int k = 0; k < 8; k++) {
                float fk = float(k);
                if (fk >= maxSheets) break;

                // Rotate across 6D Calabi-Yau projection angle
                float sheetAngle = fk * TAU / nExp + uTwist * 0.65 + t * 0.22;
                vec2 wk = rot2(sheetAngle) * w;

                // Complex hyperbolic cosine/sine projection of z1^n + z2^n = 1
                float u = wk.x;
                float v = clamp(wk.y, -2.2, 2.2);
                float ch = 0.5 * (exp(v) + exp(-v));
                float sh = 0.5 * (exp(v) - exp(-v));

                vec2 cosZ = vec2(cos(u) * ch, -sin(u) * sh);
                vec2 sinZ = vec2(sin(u) * ch,  cos(u) * sh);

                float rad1 = safePow(length(cosZ), 2.0 / nExp);
                float ang1 = (safeAtan(cosZ.y, cosZ.x) + fk * TAU) / nExp;

                float rad2 = safePow(length(sinZ), 2.0 / nExp);
                float ang2 = (safeAtan(sinZ.y, sinZ.x) - fk * TAU) / nExp;

                // Project 4D complex coordinates (Re(z1), Im(z1), Re(z2), Im(z2)) into 3D height
                float proj = rad1 * cos(ang1 + uTwist) + rad2 * sin(ang2 - uTwist * 0.7);
                float weight = safePow(0.76, fk);

                sheetAccum += sin(proj * PI + t * 0.6) * weight;
                branchPhase += (ang1 - ang2) * weight;
                ribbonEdge = min(ribbonEdge, abs(fract(proj * 1.5) - 0.5));

                // Elliptic modular domain fold for next sheet
                w = abs(w) / clamp(dot(w, w), 0.35, 1.45) - vec2(0.62, 0.48);
            }

            // Doubly-periodic Weierstrass elliptic lattice micro-filigree
            vec2 lat = sin(w * (2.5 + uDensity * 0.25) + t * 0.5);
            float ellipticPores = lat.x * lat.y;

            float height = sheetAccum * 0.55 + ellipticPores * 0.25;
            float phase = branchPhase * 0.45 + height * 0.85 - t * 0.15 + r0 * 0.3;
            float contour = abs(sin(sheetAccum * (3.5 + uContourCarve * 2.5))) * smoothstep(0.01, 0.18 * uContourCarve, ribbonEdge);

            return vec4(height, phase, contour, ellipticPores);
        }

        // -------------------------------------------------------------------
        // ENGINE 02: TURING-PHYSARUM MORPHOGENETIC CORAL & BACTERIAL LACE
        // Returns vec4(height, phaseMetric, contourSignal, microDetail)
        // -------------------------------------------------------------------
        vec4 evalEngine02_TuringPhysarum(vec2 p, float t) {
            vec2 q = p - uMouse * 0.4;
            // Subtle organic symmetry warp
            float r = length(q);
            float a = safeAtan(q.y, q.x);
            a += 0.12 * sin(a * uSymmetry + r * 3.0 - t * 0.4);
            q = vec2(cos(a), sin(a)) * r * (1.8 + uDensity * 0.12);

            float activator = 0.0;
            float inhibitor = 0.0;
            float slimeVein = 1e4;
            float freq = 1.65;
            float amp = 0.65;
            float octs = clamp(uOctaves, 2.0, 9.0);

            for (int i = 0; i < 9; i++) {
                float fi = float(i);
                if (fi >= octs) break;

                vec2 sp = q * freq + vec2(sin(t * 0.35 + fi), cos(t * 0.28 - fi * 1.3));

                // Coupled Swift-Hohenberg / Turing Band-Pass Wavelet Triad (120 deg hexagonal basis)
                float w1 = cos(sp.x * 2.0 + sin(sp.y * 1.5 + uTwist));
                float w2 = cos((-0.5 * sp.x + 0.866025 * sp.y) * 2.0 + sin(sp.x * 1.4 - t * 0.5));
                float w3 = cos((-0.5 * sp.x - 0.866025 * sp.y) * 2.0 + cos(sp.y * 1.4 + t * 0.4));

                float triad = (w1 + w2 + w3) / 3.0;
                // Inhibitor ring at 2x spatial frequency (Difference-of-Gaussians kernel)
                float inhib = (cos(sp.x * 4.0) + cos(sp.y * 4.0)) * 0.25;

                float rdLayer = triad - inhib * (0.45 + 0.15 * sin(uTwist));
                activator += rdLayer * amp;
                inhibitor += abs(rdLayer) * amp;

                // Chemotactic Physarum slime-mold filament ridge
                float vein = abs(triad);
                slimeVein = min(slimeVein, vein);

                // Curl advection of coordinate along reaction-diffusion gradient
                vec2 curlStep = vec2(-sin(sp.y * 2.0), sin(sp.x * 2.0)) * 0.42;
                q = rot2(0.52 + uTwist * 0.12) * (q + curlStep * amp);

                freq *= 1.62;
                amp *= 0.72;
            }

            // Hexagonal Diatom Silica Frustule Micro-Pores (Areolae) inside bacterial cells
            vec2 hexP = q * (1.2 + uDensity * 0.18);
            float hex1 = sin(hexP.x);
            float hex2 = sin(-0.5 * hexP.x + 0.866025 * hexP.y);
            float hex3 = sin(-0.5 * hexP.x - 0.866025 * hexP.y);
            float diatomPores = abs(hex1 * hex2 * hex3);

            float height = activator * 0.75 + diatomPores * 0.25;
            float phase = (activator - inhibitor * 0.6) * 1.15 + uTwist * 0.25 - t * 0.14;

            // Chitinous dark cell walls where activator crosses zero (mitosis membrane boundary)
            float cellWall = smoothstep(0.02, 0.24 * uContourCarve, abs(activator));
            float poreWall = smoothstep(0.03, 0.20 * uContourCarve, diatomPores + 0.08);
            float contour = cellWall * mix(0.35, 1.0, poreWall);

            return vec4(height, phase, contour, diatomPores);
        }

        // -------------------------------------------------------------------
        // ENGINE 03: RIEMANN ZETA & CROP-CIRCLE HARMONIC CYMATICS
        // Returns vec4(height, phaseMetric, contourSignal, microDetail)
        // -------------------------------------------------------------------
        vec4 evalEngine03_CropCircleZeta(vec2 p, float t) {
            vec2 z = (p - uMouse * 0.35) * (1.5 + uDensity * 0.08);
            float r = length(z) + 1e-5;
            float theta = safeAtan(z.y, z.x);
            float nSym = floor(clamp(uSymmetry, 3.0, 24.0));

            // 1. Truncated Dirichlet / Riemann Eta-Zeta Complex Series along critical strip
            vec2 zetaSum = vec2(0.0);
            vec2 sComplex = vec2(0.5 + cos(r * 2.0 - t * 0.3) * 0.35, (theta * nSym / PI + r * uTwist * 1.5) * 3.0);
            float maxTerms = clamp(uOctaves, 3.0, 9.0);

            for (int m = 1; m <= 9; m++) {
                float fm = float(m);
                if (fm > maxTerms) break;
                float logM = log(fm);
                float mag = safePow(fm, -sComplex.x);
                float ang = -sComplex.y * logM + t * 0.4 * (mod(fm, 2.0) == 0.0 ? -1.0 : 1.0);
                float altSign = (mod(fm, 2.0) < 0.5) ? -1.0 : 1.0;
                zetaSum += altSign * mag * vec2(cos(ang), sin(ang));
            }

            float zetaPhase = safeAtan(zetaSum.y, zetaSum.x) / TAU;
            float zetaMag = length(zetaSum);

            // 2. Authentic Wiltshire Crop-Circle Standing-Wave Geometry
            // Nested Epitrochoid / Hypotrochoid Spirograph Gear Rings
            float epiWave = r - (0.75 + 0.18 * cos(nSym * theta + t * 0.6) + 0.10 * cos(nSym * 2.0 * theta - t * 0.9 + uTwist));
            float gearTrack = sin(epiWave * (12.0 + uDensity * 0.6));

            // Off-Center Crescent / Vesica Piscis Satellite Circles (Milk Hill / Crabwood motif)
            vec2 foldZ = foldDihedral(z, nSym);
            float satDist1 = length(foldZ - vec2(0.68 + 0.12 * sin(t * 0.5), 0.0)) - 0.32;
            float satDist2 = length(foldZ - vec2(0.62, 0.08 * cos(t * 0.5 + uTwist))) - 0.26;
            float vesicaCrescent = sin(min(abs(satDist1), abs(satDist2)) * (18.0 + uDensity));

            // Bessel J_0 / J_n Cymatic Standing Wave + Phyllotaxis Golden Spiral Lattice
            float besselCymatic = cos(r * (8.0 + uDensity * 0.5) - t * 1.2) * cos(nSym * theta);
            float goldenSpiral = sin(log(r + 0.05) * nSym * PHI + theta * nSym - t * 0.8);

            float height = (gearTrack * 0.35 + vesicaCrescent * 0.30 + besselCymatic * 0.25 + goldenSpiral * 0.20);
            float phase = zetaPhase + height * 0.45 + zetaMag * 0.25 + uTwist * 0.15;

            // Razor-sharp Crop-Circle blueprint tracks and nodal lines
            float c1 = smoothstep(0.04, 0.28 * uContourCarve, abs(height));
            float c2 = smoothstep(0.02, 0.22 * uContourCarve, abs(sin(zetaPhase * PI * 6.0)));
            float contour = c1 * mix(0.28, 1.0, c2);

            return vec4(height, phase, contour, goldenSpiral);
        }

        // -------------------------------------------------------------------
        // ENGINE 04: HOPF FIBRATION MHD PLASMA & FERROFLUID FOAM
        // Returns vec4(height, phaseMetric, contourSignal, microDetail)
        // -------------------------------------------------------------------
        vec4 evalEngine04_HopfFerroFoam(vec2 p, float t) {
            vec2 q = (p - uMouse * 0.4) * (1.35 + uDensity * 0.06);
            float r2 = dot(q, q);
            float nSym = clamp(uSymmetry, 3.0, 24.0);

            // 1. 4D Stereographic Inverse Hopf Projection (R^2 -> S^3)
            float denom = 1.0 / (1.0 + r2);
            float psi = uTwist * 0.8 + t * 0.35 + sin(safeAtan(q.y, q.x) * floor(nSym * 0.5)) * 0.4;
            vec4 hopf4 = vec4(
                2.0 * (q.x * cos(psi) - q.y * sin(psi)) * denom,
                2.0 * (q.x * sin(psi) + q.y * cos(psi)) * denom,
                (1.0 - r2) * denom * cos(psi * 0.7),
                (1.0 - r2) * denom * sin(psi * 0.7)
            );

            // 2. Magnetohydrodynamic (MHD) Alfvén Linked Flux Filaments
            float fluxTube = sin(hopf4.x * nSym + hopf4.w * 4.0 + t) * cos(hopf4.y * nSym - hopf4.z * 4.0 - t * 0.8);

            // 3. Smooth-Voronoi Rosensweig Ferrofluid Spikes & Plateau Soap-Bubble Borders
            vec2 cellUV = foldDihedral(q, max(3.0, floor(nSym * 0.5))) * (2.2 + uDensity * 0.16) + vec2(fluxTube * 0.35);
            vec2 iCell = floor(cellUV);
            vec2 fCell = fract(cellUV);

            float dMin1 = 8.0;
            float dMin2 = 8.0;
            float smoothBubble = 8.0;

            for (int y = -1; y <= 1; y++) {
                for (int x = -1; x <= 1; x++) {
                    vec2 neighbor = vec2(float(x), float(y));
                    vec2 rnd = hash22(iCell + neighbor);
                    vec2 pt = neighbor + 0.5 + 0.42 * sin(t * 0.9 + TAU * rnd + uTwist);
                    vec2 diff = pt - fCell;
                    float d = length(diff);

                    smoothBubble = smin(smoothBubble, d, 0.32);
                    if (d < dMin1) {
                        dMin2 = dMin1;
                        dMin1 = d;
                    } else if (d < dMin2) {
                        dMin2 = d;
                    }
                }
            }

            // Plateau soap-film border metric (dMin2 - dMin1 = 0 at cell boundaries)
            float plateauBorder = dMin2 - dMin1;
            // Conical Rosensweig ferrofluid spike at cell centers
            float ferroSpike = cos(smoothBubble * PI * 2.5 - t * 1.4) * exp(-smoothBubble * 1.2);

            float height = ferroSpike * 0.65 + fluxTube * 0.35;
            float phase = smoothBubble * 0.85 + fluxTube * 0.45 - t * 0.18 + plateauBorder * 0.5;

            // Dark magnetic valleys & crisp Plateau borders
            float borderCarve = smoothstep(0.015, 0.14 * uContourCarve, plateauBorder);
            float ringCarve = smoothstep(0.03, 0.22 * uContourCarve, abs(sin(smoothBubble * (6.0 + uDensity * 0.3))));
            float contour = borderCarve * mix(0.25, 1.0, ringCarve);

            return vec4(height, phase, contour, plateauBorder);
        }

        // -------------------------------------------------------------------
        // UNIFIED MULTI-ENGINE CROSS-MORPHER
        // -------------------------------------------------------------------
        vec4 evaluateUnifiedField(vec2 p, float t) {
            float m = clamp(uEngineMorph, 0.0, 3.0);

            if (m <= 0.001) return evalEngine01_CalabiYau(p, t);
            if (abs(m - 1.0) <= 0.001) return evalEngine02_TuringPhysarum(p, t);
            if (abs(m - 2.0) <= 0.001) return evalEngine03_CropCircleZeta(p, t);
            if (m >= 2.999) return evalEngine04_HopfFerroFoam(p, t);

            if (m < 1.0) {
                return mix(evalEngine01_CalabiYau(p, t), evalEngine02_TuringPhysarum(p, t), smoothstep(0.0, 1.0, m));
            } else if (m < 2.0) {
                return mix(evalEngine02_TuringPhysarum(p, t), evalEngine03_CropCircleZeta(p, t), smoothstep(0.0, 1.0, m - 1.0));
            } else {
                return mix(evalEngine03_CropCircleZeta(p, t), evalEngine04_HopfFerroFoam(p, t), smoothstep(0.0, 1.0, m - 2.0));
            }
        }

        // -------------------------------------------------------------------
        // 4-ANGLE SPOT-NEON SCREEN-PRINT HALFTONE ROSETTE (BLACK SUBSTRATE)
        // -------------------------------------------------------------------
        float spotHalftoneDot(vec2 metricUV, float angleDeg, float lpi, float inkVal) {
            float rad = angleDeg * (PI / 180.0);
            vec2 g = rot2(rad) * metricUV * lpi;
            vec2 cell = fract(g) - 0.5;
            float d = length(cell) * 1.41421356;
            // Capped at 0.78 so dark black shirt substrate ALWAYS shows between dots
            float dotRadius = sqrt(clamp(inkVal, 0.0, 1.0)) * 0.78;
            return 1.0 - smoothstep(dotRadius - 0.12, dotRadius + 0.12, d);
        }

        void main() {
            vec2 uv = vUv;
            vec2 p = uv * 2.0 - 1.0;
            float aspect = uResolution.x / max(uResolution.y, 1.0);
            p.x *= aspect;

            float t = uTime;

            // --- 1. ANALOG VHS SYNC TEAR & WAVE WOBBLE ---
            if (uGlitch > 0.005) {
                float band = floor(uv.y * 44.0 - t * 6.5);
                float rnd = hash12(vec2(band, floor(t * 14.0)));
                float tearMask = step(0.91 - min(uGlitch, 1.2) * 0.15, rnd);
                float tearOffset = (hash12(vec2(uv.y * 85.0, t)) - 0.5) * 0.11 * uGlitch * tearMask;
                float syncWave = sin(uv.y * 32.0 + t * 9.5) * 0.005 * uGlitch;
                p.x += tearOffset + syncWave;
            }

            // Apply continuous field zoom
            vec2 worldP = p / clamp(uZoom, 0.20, 6.0);

            // --- 2. FINITE-DIFFERENCE 3D NORMAL & CHROMATIC DISPERSION ---
            float eps = 0.004 / clamp(uZoom, 0.3, 4.0);
            vec4 centerSample = evaluateUnifiedField(worldP, t);
            vec4 sampleX = centerSample, sampleY = centerSample;
            if (uAstralQuality > 0.5) {
                sampleX = evaluateUnifiedField(worldP + vec2(eps, 0.0), t);
                sampleY = evaluateUnifiedField(worldP + vec2(0.0, eps), t);
            }

            float h0 = centerSample.x;
            float hX = sampleX.x;
            float hY = sampleY.x;

            vec3 normal = normalize(vec3((h0 - hX) / eps * 0.08, (h0 - hY) / eps * 0.08, 1.0));
            vec3 viewDir = vec3(0.0, 0.0, 1.0);

            // --- 3. THIN-FILM IRIDESCENCE & CHROMATIC PRISM SPLIT ---
            float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
            float basePhase = centerSample.y + fresnel * 0.45 * uGloss + h0 * 0.25;
            float prismShift = (0.025 + length(normal.xy) * 0.06) * (0.35 + uGlitch);

            vec3 palR = evaluateNeonPalette(basePhase + prismShift);
            vec3 palG = evaluateNeonPalette(basePhase);
            vec3 palB = evaluateNeonPalette(basePhase - prismShift);

            vec3 rawNeon = vec3(palR.r, palG.g, palB.b);

            // Blend in secondary harmonic hue along micro-details
            vec3 accentHue = evaluateNeonPalette(basePhase + 0.38);
            rawNeon = mix(rawNeon, accentHue, clamp(abs(centerSample.w) * 0.45, 0.0, 0.65));

            // --- 4. DUAL-LIGHT SPECULAR MICRO-GLOSS (COLORED NEON HIGHLIGHTS) ---
            if (uGloss > 0.01) {
                vec3 L1 = normalize(vec3(cos(t * 0.8) * 0.7, sin(t * 0.6) * 0.7, 0.9));
                vec3 L2 = normalize(vec3(-sin(t * 0.5) * 0.8, cos(t * 0.7) * 0.8, 0.75));
                vec3 H1 = normalize(L1 + viewDir);
                vec3 H2 = normalize(L2 + viewDir);

                float spec1 = safePow(max(dot(normal, H1), 0.0), 28.0);
                float spec2 = safePow(max(dot(normal, H2), 0.0), 18.0);

                // Tinted with complementary neon palette stops so highlights never turn white
                vec3 specHue1 = evaluateNeonPalette(basePhase + 0.22);
                vec3 specHue2 = evaluateNeonPalette(basePhase + 0.58);

                rawNeon += specHue1 * spec1 * uGloss * 0.75;
                rawNeon += specHue2 * spec2 * uGloss * 0.55;
            }

            // --- 5. DARK-GROUND OBSIDIAN CONTOUR CARVING ---
            float ridgeSlope = length(normal.xy);
            float slopeCarve = (1.0-smoothstep(0.15, 0.88, ridgeSlope * uContourCarve * 0.85));
            float totalCarve = clamp(centerSample.z * mix(0.45, 1.0, slopeCarve), 0.0, 1.0);

            // Lock to pure neon over #04010a obsidian void
            vec3 faithfulColor = clamp(rawNeon*(0.4+0.6*totalCarve)*uAcid*0.42,0.0,1.0);
            vec3 lockedColor = mix(faithfulColor, lockAcidNeon(rawNeon,uAcid,totalCarve), clamp(uChromaLock,0.0,1.0));

            // --- 6. SPOT-NEON SCREEN-PRINT HALFTONE ROSETTE ENGINE ---
            if (uHalftoneMix > 0.005) {
                vec2 metricUV = (uv - 0.5) * vec2(aspect, 1.0);
                float lpi = 55.0 + uDensity * 3.2;

                float cIntensity = clamp(lockedColor.b * 0.75 + lockedColor.g * 0.45, 0.0, 1.0);
                float mIntensity = clamp(lockedColor.r * 0.80 + lockedColor.b * 0.35, 0.0, 1.0);
                float yIntensity = clamp(lockedColor.g * 0.80 + lockedColor.r * 0.35, 0.0, 1.0);
                float vIntensity = clamp(max(lockedColor.r, lockedColor.b) * 0.70, 0.0, 1.0);

                float dotC = spotHalftoneDot(metricUV, 15.0, lpi, cIntensity);
                float dotM = spotHalftoneDot(metricUV, 75.0, lpi, mIntensity);
                float dotY = spotHalftoneDot(metricUV, 0.0,  lpi, yIntensity);
                float dotV = spotHalftoneDot(metricUV, 45.0, lpi * 0.7071, vIntensity);

                vec3 blackShirt = vec3(0.016, 0.004, 0.04);
                vec3 plastisol = blackShirt;
                plastisol = max(plastisol, vec3(0.55, 0.00, 1.00) * dotV * 0.65);
                plastisol = max(plastisol, vec3(0.00, 0.96, 1.00) * dotC * 0.95);
                plastisol = max(plastisol, vec3(1.00, 0.00, 0.55) * dotM * 0.95);
                plastisol = max(plastisol, vec3(0.75, 1.00, 0.00) * dotY * 0.85);

                // Re-lock plastisol print to guarantee zero whiteout
                plastisol = lockAcidNeon(plastisol, uAcid, totalCarve);
                lockedColor = mix(lockedColor, plastisol, uHalftoneMix);
            }

            // Optional CRT Scanlines
            if (uGlitch > 0.01) {
                float scan = (sin(gl_FragCoord.y * PI) * 0.5 + 0.5) * 0.16 * min(uGlitch, 1.0);
                lockedColor *= (1.0 - scan);
            }

            // Crisp Dark Vignette
            float vig = 1.0 - smoothstep(0.72, 1.68, length(uv * 2.0 - 1.0));
            lockedColor *= mix(0.72, 1.0, vig);

            gl_FragColor = vec4(clamp(lockedColor, 0.0, 1.0),uAstralOpacity);
        }
