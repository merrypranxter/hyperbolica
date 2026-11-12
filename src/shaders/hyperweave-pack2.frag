        precision highp float;

        varying vec2 vUv;

        uniform vec2  uResolution;
        uniform float uTime;
        uniform vec2  uMouse;
        uniform float uZoom;

        uniform float uEngineMorph;   // 0.0: E5 Girih, 1.0: E6 Caustic Gem, 2.0: E7 Jacquard Memphis, 3.0: E8 BZ Mycelium
        uniform float uSymmetry;      // 3 .. 20
        uniform float uDepth;         // 2 .. 14
        uniform float uDetailFreq;    // 2.0 .. 28.0
        uniform float uTension;       // 0.15 .. 3.50
        uniform float uPhaseShift;    // 0.00 .. 1.00
        uniform float uAcidOverdrive; // 0.60 .. 3.60
        uniform float uInkWeight;     // 0.15 .. 2.20
        uniform float uEngravingMix;  // 0.00 .. 1.00
        uniform float uDispersion;    // 0.00 .. 1.50
        uniform sampler2D u_palette;
        uniform float uPalettePhase;
        uniform float uChromaLock;
        uniform float uPackOpacity;
        uniform float uPackQuality;

        #define PI  3.14159265359
        #define TAU 6.28318530718
        #define PHI 1.61803398875

        // -------------------------------------------------------------------
        // 1. MANDATORY NaN-SAFE & ANTI-WHITEOUT MATHEMATICAL GUARDS
        // -------------------------------------------------------------------
        float safePow(float b, float e) {
            return pow(max(abs(b), 1e-6), e);
        }

        vec3 safePow3(vec3 b, float e) {
            return pow(max(abs(b), vec3(1e-6)), vec3(e));
        }

        float safeAtan(float y, float x) {
            float sx = (abs(x) + abs(y) < 1e-6) ? 1e-6 : x;
            return atan(y, sx);
        }

        vec3 safeTanh3(vec3 x) {
            vec3 c = clamp(x, 0.0, 10.0);
            return c * (27.0 + c * c) / (27.0 + 9.0 * c * c);
        }

        mat2 rot2D(float a) {
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

        // Complex-Plane Division & Conformal Mobius Warp
        vec2 cMul(vec2 a, vec2 b) {
            return vec2(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
        }

        vec2 cDiv(vec2 a, vec2 b) {
            float denom = max(dot(b, b), 1e-6);
            return vec2(a.x * b.x + a.y * b.y, a.y * b.x - a.x * b.y) / denom;
        }

        // Dihedral N-Fold Sector Reflection
        vec2 foldDihedral(vec2 p, float nSides) {
            float r = length(p);
            float a = safeAtan(p.y, p.x);
            float sector = TAU / clamp(nSides, 3.0, 24.0);
            a = mod(a + 0.5 * sector, sector) - 0.5 * sector;
            a = sqrt(a * a + 1e-6);
            return vec2(cos(a), sin(a)) * r;
        }

        // -------------------------------------------------------------------
        // 2. HYPER-SATURATED LISA FRANK / 1980s NEW WAVE SPECTRAL RING
        // -------------------------------------------------------------------
        vec3 neonSpectralPalette(float t){
            return texture2D(u_palette,vec2(fract(t+uPhaseShift+uPalettePhase),0.5)).rgb;
        }

                // -------------------------------------------------------------------
        // 3. CRITICAL ANTI-WHITEOUT & OBSIDIAN INK LOCK POST-PROCESSOR
        // -------------------------------------------------------------------
        vec3 lockAcidNeon(vec3 col, float inkMask, float overdrive) {
            // Scrub invalid or negative values
            vec3 c = clamp(col, 0.0, 12.0);
            if (!(c.r >= 0.0 && c.r <= 12.0)) c.r = 0.0;
            if (!(c.g >= 0.0 && c.g <= 12.0)) c.g = 0.0;
            if (!(c.b >= 0.0 && c.b <= 12.0)) c.b = 0.0;

            // Strip any achromatic white floor: R, G, and B can NEVER all be high simultaneously
            float whiteFloor = min(c.r, min(c.g, c.b));
            c = max(c - whiteFloor * 0.86, vec3(0.0));

            // Normalize by peak channel and sharpen spectral purity
            float peak = max(c.r, max(c.g, max(c.b, 1e-5)));
            vec3 pureHue = safePow3(c / peak, 1.16);

            // Rational overdrive curve (never clips to white)
            float energy = 1.0 - exp(-peak * overdrive * 1.25);
            vec3 neonRGB = safeTanh3(pureHue * energy * (0.95 + 0.38 * overdrive));

            // Carve pitch-black obsidian structural ink trenches (#04010a)
            vec3 obsidianInk = vec3(0.0157, 0.0039, 0.0392);
            return mix(obsidianInk, neonRGB, clamp(inkMask, 0.0, 1.0));
        }

        // -------------------------------------------------------------------
        // ENGINE 05 (Index 0): POINCARÉ HYPERBOLIC GIRIH TILING & LACE
        // Returns vec4(heightField, colorPhase, obsidianInkMask, microEngrave)
        // -------------------------------------------------------------------
        vec4 evalEngine05_HyperbolicGirih(vec2 p, float t) {
            // Map infinite plane into conformal hyperbolic Poincare disk tiles so 100% of screen is filled
            vec2 q = (p - uMouse * 0.45) * (0.85 + uDetailFreq * 0.06);
            vec2 cellWave = sin(q * 1.35 + vec2(sin(q.y * 0.9 + t * 0.25), cos(q.x * 0.9 - t * 0.2)));
            vec2 z = cellWave * 0.72;

            // Conformal Mobius translation inside unit disk: (z + a) / (1 + conj(a)*z)
            vec2 aMob = vec2(cos(t * 0.35), sin(t * 0.28)) * 0.32 * clamp(uTension * 0.4, 0.0, 0.75);
            vec2 conjA = vec2(aMob.x, -aMob.y);
            z = cDiv(z + aMob, vec2(1.0, 0.0) + cMul(conjA, z));

            // Exact Schwarz (p, q, 2) Hyperbolic Reflection Circle Geometry
            float pSym = clamp(floor(uSymmetry), 5.0, 20.0);
            float qSym = 3.0 + mod(floor(uTension), 2.0); // Alternates (p,3,2) and (p,4,2)
            float angleP = PI / pSym;
            float angleQ = PI / qSym;

            float cosP = cos(angleP), sinP = max(sin(angleP), 0.05);
            float cosQ = cos(angleQ), sinQ = max(sin(angleQ), 0.05);

            // Distance of orthogonal hyperbolic geodesic circle center & radius
            float centerDist = cosQ / sinP;
            float radiusSq = max(centerDist * centerDist - 1.0, 0.08);
            float radius = sqrt(radiusSq);
            vec2 invCenter = vec2(centerDist * (0.92 + 0.08 * sin(t * 0.3)), 0.0);

            float invCount = 0.0;
            float conformalScale = 1.0;
            float minGeodesicArc = 1e4;
            int maxIter = int(clamp(uDepth, 2.0, 14.0));

            for (int i = 0; i < 14; i++) {
                if (i >= maxIter) break;

                // 1. Dihedral reflection across fundamental sector mirrors
                z = foldDihedral(z, pSym);

                // 2. Hyperbolic Circle Inversion across geodesic arc
                vec2 diff = z - invCenter;
                float d2 = max(dot(diff, diff), 1e-5);
                minGeodesicArc = min(minGeodesicArc, abs(sqrt(d2) - radius));

                if (d2 < radiusSq) {
                    float factor = radiusSq / d2;
                    z = invCenter + diff * factor;
                    conformalScale *= factor;
                    invCount += 1.0;
                } else {
                    break;
                }
            }

            // Synthesize Interlocking Islamic Girih Star Straps & Over-Under Weave
            vec2 localZ = (z - invCenter * 0.5) * (3.5 + uDetailFreq * 0.22);
            float strapA = sin((localZ.x + localZ.y * PHI) * PI);
            float strapB = sin((localZ.x * PHI - localZ.y) * PI);
            float girihRibbon = min(abs(strapA), abs(strapB));

            // Over-under strap crossing parity
            float crossingParity = sign(strapA * strapB) * (mod(invCount, 2.0) * 2.0 - 1.0);
            float strapHeight = cos(girihRibbon * PI * 2.0) * 0.55 + crossingParity * 0.25;

            // Microscopic Lace Tatting Perforations inside each hyperbolic tile
            float laceEyelet = abs(sin(length(localZ) * (8.0 + uDetailFreq * 0.4) - t * 1.2));
            float height = strapHeight + laceEyelet * 0.25;

            // Color Phase from inversion parity + hyperbolic log-scale
            float phase = invCount * 0.19 + log(1.0 + conformalScale) * 0.22 + strapHeight * 0.35 - t * 0.12;

            // Deep Obsidian Ink Lines along Girih strap borders & hyperbolic geodesic arcs
            float strapOutline = smoothstep(0.03 * uInkWeight, 0.22 * uInkWeight, abs(girihRibbon - 0.18));
            float geodesicLine = smoothstep(0.015 * uInkWeight, 0.09 * uInkWeight, minGeodesicArc);
            float lacePores    = smoothstep(0.08 * uInkWeight, 0.35 * uInkWeight, laceEyelet);
            float inkMask      = strapOutline * geodesicLine * mix(0.28, 1.0, lacePores);

            return vec4(height, phase, inkMask, strapA * strapB);
        }

        // -------------------------------------------------------------------
        // ENGINE 06 (Index 1): ABYSSAL CATACAUSTIC PHOTON NETWORKS & NEOVIUS GEM
        // Returns vec4(heightField, colorPhase, obsidianInkMask, microEngrave)
        // -------------------------------------------------------------------
        // Helper: Refractive Optical Wave Potential & Analytical 2x2 Hessian Determinant
        vec3 evalCausticJacobian(vec2 uvCoord, float t, float tension) {
            vec2 p = uvCoord;
            float totalCaustic = 0.0;
            float detAccum = 0.0;
            float amp = 1.0;
            float freq = 1.85;
            int maxOct = int(clamp(uDepth * 0.65, 2.0, 8.0));

            for (int i = 0; i < 8; i++) {
                if (i >= maxOct) break;
                float fi = float(i);
                vec2 q = rot2D(fi * 0.618 * PI + t * 0.08) * p * freq;

                // Dual crossed refractive wave potential Phi(x,y)
                float wx = q.x + sin(q.y * 1.3 + t * 0.9);
                float wy = q.y + cos(q.x * 1.3 - t * 0.8);

                // Analytical second partial derivatives (2x2 Hessian Matrix H)
                float hxx = -cos(wx) - 1.69 * cos(wy) * sin(q.x * 1.3 - t * 0.8);
                float hyy = -cos(wy) - 1.69 * cos(wx) * cos(q.y * 1.3 + t * 0.9);
                float hxy = -1.3 * sin(wx) * cos(q.y * 1.3 + t * 0.9);

                // Jacobian Determinant of Ray Mapping: det(I + tau * H)
                float tau = 0.38 * tension;
                float detJ = (1.0 + tau * hxx) * (1.0 + tau * hyy) - (tau * tau * hxy * hxy);

                // Catacaustic envelope spikes where |detJ| -> 0
                float causticSpike = 1.0 / (abs(detJ) + 0.085);
                totalCaustic += clamp(causticSpike * 0.14, 0.0, 2.4) * amp;
                detAccum += detJ * amp;

                // Deflect ray along refractive gradient for next octave
                p += vec2(sin(wx), sin(wy)) * 0.22 * amp;
                freq *= 1.52;
                amp *= 0.72;
            }
            return vec3(totalCaustic, detAccum, length(p));
        }

        vec4 evalEngine06_CausticNeovius(vec2 p, float t) {
            vec2 z = (p - uMouse * 0.4) * (1.2 + uDetailFreq * 0.09);
            z = foldDihedral(z, uSymmetry);

            // 3D Neovius & Schwarz-P Triply Periodic Minimal Surface Gem Lattice
            vec3 gp = vec3(z * 2.2, sin(length(z) * 2.5 - t * 0.6) * 1.5);
            float cosX = cos(gp.x), cosY = cos(gp.y), cosZ = cos(gp.z);
            float neovius = 3.0 * (cosX + cosY + cosZ) + 4.0 * cosX * cosY * cosZ;
            float schwarzP = cosX + cosY + cosZ;
            float gemFacet = mix(neovius * 0.25, schwarzP * 0.45, 0.4);

            // Evaluate Catacaustic Jacobian Network
            vec3 causticData = evalCausticJacobian(z + gemFacet * 0.18, t, uTension);
            float photonWeb = causticData.x;
            float jacobianDet = causticData.y;

            float height = photonWeb * 0.65 + gemFacet * 0.35;
            float phase  = photonWeb * 0.42 - gemFacet * 0.30 + jacobianDet * 0.15 - t * 0.14;

            // Carve dark obsidian crystal facet trenches between blazing caustic filaments
            float facetEdge = smoothstep(0.03 * uInkWeight, 0.26 * uInkWeight, abs(fract(gemFacet * 1.5) - 0.5));
            float causticValley = smoothstep(0.32 * uInkWeight, 1.15, photonWeb);
            float inkMask = clamp(max(causticValley, facetEdge * 0.65) * facetEdge, 0.0, 1.0);

            return vec4(height, phase, inkMask, neovius);
        }

        // -------------------------------------------------------------------
        // ENGINE 07 (Index 2): JACQUARD HYPER-LOOM BROCADE & MEMPHIS MATRIX
        // Returns vec4(heightField, colorPhase, obsidianInkMask, microEngrave)
        // -------------------------------------------------------------------
        vec4 evalEngine07_JacquardMemphis(vec2 p, float t) {
            vec2 q = p - uMouse * 0.35;

            // Optional kaleidoscopic loom symmetry when uSymmetry > 4
            if (uSymmetry > 4.5) {
                q = mix(q, foldDihedral(q, uSymmetry), 0.65);
            }

            // 1. Warp & Weft Jacquard Thread Matrix Coordinates
            float loomScale = 6.0 + uDetailFreq * 1.15;
            // Subtle Memphis squiggle shear
            vec2 loomUV = q * loomScale;
            vec2 shearedUV = vec2(
                loomUV.x + sin(q.y * 8.0 + t * 1.2) * 0.35 * uTension,
                loomUV.y + cos(q.x * 8.0 - t * 1.0) * 0.35 * uTension
            );

            vec2 threadCell = floor(shearedUV);
            vec2 threadLocal = fract(shearedUV) - 0.5; // [-0.5, 0.5] within each yarn cell

            // 2. Binary Jacquard Damask & Twill Pattern Punch-Card Logic
            float diamondDamask = abs(mod(threadCell.x + threadCell.y + floor(t * 2.0), 8.0) - 4.0)
                                + abs(mod(threadCell.x - threadCell.y, 8.0) - 4.0);
            float twillStep = mod(threadCell.x + threadCell.y * 2.0 + floor(uDepth), 4.0);
            // Determines whether Warp (vertical) or Weft (horizontal) yarn rides on top
            float warpOnTop = step(2.0, mod(diamondDamask + twillStep, 4.0));

            // 3. Multi-Filament Spun Silk/Metallic Yarn Bundle Geometry
            // Active yarn profile vs cross-under yarn profile
            float warpProfile = cos(threadLocal.x * PI);
            float weftProfile = cos(threadLocal.y * PI);
            float yarnCrown = mix(weftProfile, warpProfile, warpOnTop);

            // Micro-fiber helical twist plies along the active yarn bundle
            float twistCoord = mix(
                shearedUV.x * 4.0 + threadLocal.y * 14.0,
                shearedUV.y * 4.0 - threadLocal.x * 14.0,
                warpOnTop
            );
            float microFiberPly = sin(twistCoord * PI + t * 2.0) * 0.5 + 0.5;

            // 4. 1980s New Wave / Memphis Milano Geometric Primitives Overlay
            vec2 memphisGrid = fract(q * (1.8 + uDepth * 0.15) + vec2(t * 0.08, -t * 0.06)) - 0.5;
            // Stepped ziggurat pyramid + radical micro-checkerboard + confetti squiggle
            float ziggurat = floor(max(abs(memphisGrid.x), abs(memphisGrid.y)) * 8.0) / 8.0;
            float checker  = mod(floor(shearedUV.x * 0.5) + floor(shearedUV.y * 0.5), 2.0);
            float squiggle = sin(q.x * 18.0 + sin(q.y * 14.0 + t * 2.5) * 2.5);

            float height = yarnCrown * (0.65 + 0.25 * microFiberPly) + ziggurat * 0.35;
            float phase  = warpOnTop * 0.28 + ziggurat * 0.85 + checker * 0.18 + microFiberPly * 0.15 - t * 0.12;

            // Carve deep obsidian gaps between adjacent threads & around Memphis shapes
            float threadGap = smoothstep(0.05 * uInkWeight, 0.32 * uInkWeight, yarnCrown);
            float plyGroove = mix(0.42, 1.0, smoothstep(0.1, 0.7, microFiberPly));
            float memphisBorder = smoothstep(0.02 * uInkWeight, 0.14 * uInkWeight, abs(fract(max(abs(memphisGrid.x), abs(memphisGrid.y)) * 6.0) - 0.5));
            float inkMask = threadGap * plyGroove * mix(0.35, 1.0, memphisBorder);

            return vec4(height, phase, inkMask, squiggle);
        }

        // -------------------------------------------------------------------
        // ENGINE 08 (Index 3): BELOUSOV-ZHABOTINSKY SCROLL WAVES & MYCELIUM
        // Returns vec4(heightField, colorPhase, obsidianInkMask, microEngrave)
        // -------------------------------------------------------------------
        vec4 evalEngine08_BelousovMycelium(vec2 p, float t) {
            vec2 q = (p - uMouse * 0.4) * (1.35 + uDetailFreq * 0.07);

            // 1. Multi-Core Belousov-Zhabotinsky (BZ) Excitable Spiral Scroll Waves
            float spiralField = 0.0;
            int numCores = int(clamp(uSymmetry * 0.5, 3.0, 8.0));
            for (int k = 0; k < 8; k++) {
                if (k >= numCores) break;
                float fk = float(k);
                float coreAngle = fk * TAU / float(numCores) + t * 0.22;
                vec2 corePos = vec2(cos(coreAngle), sin(coreAngle)) * (0.65 + 0.2 * sin(t * 0.4 + fk));
                vec2 dVec = q - corePos;
                float rCore = sqrt(dot(dVec, dVec) + 0.008);
                float thetaCore = safeAtan(dVec.y, dVec.x);
                // Topological charge chirality alternates +1 / -1
                float chirality = (mod(fk, 2.0) < 0.5) ? 1.0 : -1.0;
                float wave = sin(rCore * (7.5 + uDetailFreq * 0.35) - chirality * thetaCore * 2.0 - t * 2.4);
                spiralField += wave / (1.0 + rCore * 1.15);
            }

            // 2. Branching Lichtenberg / Mycelial Hyphae Dendrite Network
            vec2 hyphaP = foldDihedral(q, max(3.0, floor(uSymmetry * 0.5))) * 1.8;
            float mycelium = 0.0;
            float minBranch = 1e4;
            float amp = 0.65;
            float freq = 1.95;
            int maxOct = int(clamp(uDepth, 3.0, 11.0));

            for (int i = 0; i < 11; i++) {
                if (i >= maxOct) break;
                float fi = float(i);
                vec2 sp = hyphaP * freq + vec2(spiralField * 0.55 * uTension);

                // Ridge-folded dendrite filament equation
                float n1 = sin(sp.x + cos(sp.y * 1.35 + t * 0.5 + fi));
                float n2 = cos(sp.y - sin(sp.x * 1.35 - t * 0.4 - fi));
                float ridge = abs(n1 + n2 * 0.75);

                minBranch = min(minBranch, ridge / freq);
                float branchCrest = 1.0 - smoothstep(0.0, 0.55, ridge);
                mycelium += branchCrest * amp;

                // Deflect next generation of hyphae perpendicular to current branch
                hyphaP = rot2D(0.68 + 0.15 * uTension) * (hyphaP + vec2(n2, -n1) * 0.28 * amp);
                freq *= 1.58;
                amp *= 0.72;
            }

            // 3. Bioluminescent Fruiting Spore Stippling along Mycelial Nodes
            vec2 sporeGrid = fract(hyphaP * 3.5) - 0.5;
            float sporeDot = smoothstep(0.32, 0.06, length(sporeGrid));

            float height = spiralField * 0.45 + mycelium * 0.65 + sporeDot * 0.25;
            float phase  = spiralField * 0.55 + mycelium * 0.72 - t * 0.16 + sporeDot * 0.2;

            // Obsidian Ink Chitin Walls & Excitable Wave Troughs
            float bzFront = smoothstep(0.06 * uInkWeight, 0.38 * uInkWeight, abs(sin(spiralField * PI * 1.8)));
            float hyphaWall = smoothstep(0.02 * uInkWeight, 0.18 * uInkWeight, abs(mycelium - 0.35));
            float inkMask = clamp(mix(bzFront * hyphaWall, 1.0, sporeDot * 0.75), 0.0, 1.0);

            return vec4(height, phase, inkMask, mycelium);
        }

        // -------------------------------------------------------------------
        // UNIFIED 4-ENGINE ROUTER & CONTINUOUS CROSS-MORPHER
        // -------------------------------------------------------------------
        vec4 evaluatePack2Engines(vec2 p, float t) {
            float m = clamp(uEngineMorph, 0.0, 3.0);

            if (m <= 0.001) return evalEngine05_HyperbolicGirih(p, t);
            if (abs(m - 1.0) <= 0.001) return evalEngine06_CausticNeovius(p, t);
            if (abs(m - 2.0) <= 0.001) return evalEngine07_JacquardMemphis(p, t);
            if (m >= 2.999) return evalEngine08_BelousovMycelium(p, t);

            if (m < 1.0) {
                return mix(evalEngine05_HyperbolicGirih(p, t), evalEngine06_CausticNeovius(p, t), smoothstep(0.0, 1.0, m));
            } else if (m < 2.0) {
                return mix(evalEngine06_CausticNeovius(p, t), evalEngine07_JacquardMemphis(p, t), smoothstep(0.0, 1.0, m - 1.0));
            } else {
                return mix(evalEngine07_JacquardMemphis(p, t), evalEngine08_BelousovMycelium(p, t), smoothstep(0.0, 1.0, m - 2.0));
            }
        }

        // -------------------------------------------------------------------
        // DARK-GROUND SCREEN-PRINT HALFTONE & GUILLOCHÉ ENGRAVING MATRIX
        // -------------------------------------------------------------------
        float spotHalftoneDot(vec2 metricUV, float angleDeg, float lpi, float val) {
            float rad = angleDeg * (PI / 180.0);
            vec2 g = rot2D(rad) * metricUV * lpi;
            vec2 cell = fract(g) - 0.5;
            float dist = length(cell) * 1.41421356;
            // Max dot radius capped at 0.76 so #04010a obsidian ink always separates dots
            float radius = sqrt(clamp(val, 0.0, 1.0)) * 0.76;
            return 1.0 - smoothstep(radius - 0.12, radius + 0.12, dist);
        }

        void main() {
            vec2 uv = vUv;
            vec2 p = uv * 2.0 - 1.0;
            float aspect = uResolution.x / max(uResolution.y, 1.0);
            p.x *= aspect;

            float t = uTime;

            // --- 1. VHS HORIZONTAL SYNC TEAR & WAVE WOBBLE ---
            if (uDispersion > 0.005) {
                float band = floor(uv.y * 46.0 - t * 6.5);
                float rnd = hash12(vec2(band, floor(t * 15.0)));
                float tearMask = step(0.91 - min(uDispersion, 1.2) * 0.14, rnd);
                float tearShift = (hash12(vec2(uv.y * 90.0, t)) - 0.5) * 0.10 * uDispersion * tearMask;
                float syncWave = sin(uv.y * 30.0 + t * 9.0) * 0.0045 * uDispersion;
                p.x += tearShift + syncWave;
            }

            vec2 worldP = p / clamp(uZoom, 0.20, 6.0);

            // --- 2. ANALYTICAL / DERIVATIVE 3D SURFACE NORMALS & DISPERSION ---
            float eps = 0.0038 / clamp(uZoom, 0.3, 4.0);
            vec4 sampleC = evaluatePack2Engines(worldP, t);
            vec4 sampleX = sampleC, sampleY = sampleC;
            if(uPackQuality > 0.5) {
                sampleX = evaluatePack2Engines(worldP + vec2(eps,0.0),t);
                sampleY = evaluatePack2Engines(worldP + vec2(0.0,eps),t);
            }

            float h0 = sampleC.x;
            float gradX = (sampleX.x - h0) / eps;
            float gradY = (sampleY.x - h0) / eps;

            // Additional screen-space partial derivative boost when available
            #ifdef GL_OES_standard_derivatives
                gradX = mix(gradX, dFdx(h0) * 180.0, 0.35);
                gradY = mix(gradY, dFdy(h0) * 180.0, 0.35);
            #endif

            vec3 normal  = normalize(vec3(-gradX * 0.075, -gradY * 0.075, 1.0));
            vec3 viewDir = vec3(0.0, 0.0, 1.0);

            // --- 3. PRISMATIC RGB DISPERSION ACROSS CAUSTIC / WEAVE SLOPES ---
            float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
            float basePhase = sampleC.y + fresnel * 0.55 + h0 * 0.28;
            float dispShift = (0.03 + length(normal.xy) * 0.085) * (0.28 + uDispersion);

            vec3 colR = neonSpectralPalette(basePhase + dispShift);
            vec3 colG = neonSpectralPalette(basePhase);
            vec3 colB = neonSpectralPalette(basePhase - dispShift);

            vec3 rawNeon = vec3(colR.r, colG.g, colB.b);

            // Secondary harmonic iridescence in micro-grooves
            vec3 harmonicCol = neonSpectralPalette(basePhase + 0.42);
            rawNeon = mix(rawNeon, harmonicCol, clamp(abs(sampleC.w) * 0.42, 0.0, 0.65));

            // --- 4. ANISOTROPIC DUAL-LIGHT NEON SPECULAR SHEEN ---
            vec3 L1 = normalize(vec3(cos(t * 0.7) * 0.75, sin(t * 0.5) * 0.75, 0.85));
            vec3 L2 = normalize(vec3(-sin(t * 0.6) * 0.80, cos(t * 0.8) * 0.80, 0.70));
            vec3 H1 = normalize(L1 + viewDir);
            vec3 H2 = normalize(L2 + viewDir);

            float spec1 = safePow(max(dot(normal, H1), 0.0), 32.0);
            float spec2 = safePow(max(dot(normal, H2), 0.0), 20.0);

            // Tinted with complementary neon palette stops so specular highlights NEVER wash out to white
            vec3 specTint1 = neonSpectralPalette(basePhase + 0.25);
            vec3 specTint2 = neonSpectralPalette(basePhase + 0.62);
            rawNeon += specTint1 * spec1 * 0.95;
            rawNeon += specTint2 * spec2 * 0.70;

            // --- 5. OBSIDIAN STRUCTURAL INK TRENCHES (#04010a) ---
            float slopeMagnitude = length(normal.xy);
            float ridgeInk = (1.0-smoothstep(0.12,0.95,slopeMagnitude*uInkWeight*0.75));
            float combinedInkMask = clamp(sampleC.z * mix(0.38, 1.0, ridgeInk), 0.0, 1.0);

            // Apply Screen-Print Engraving / Guilloché Line-Cut & 4-Angle Halftone Rosette
            if (uEngravingMix > 0.005) {
                vec2 metricUV = (uv - 0.5) * vec2(aspect, 1.0);
                float lpi = 48.0 + uDetailFreq * 3.4;

                // Guilloché intaglio line-engraving along surface contours
                float guilloche = sin((metricUV.x * cos(0.4) + metricUV.y * sin(0.4) + h0 * 0.18) * lpi * PI);
                float engraveMask = smoothstep(-0.35 * uInkWeight, 0.35, guilloche);

                // 4-Angle Spot-Neon Halftone Rosette
                float cDot = spotHalftoneDot(metricUV, 15.0, lpi * 0.85, clamp(rawNeon.b + rawNeon.g * 0.5, 0.0, 1.0));
                float mDot = spotHalftoneDot(metricUV, 75.0, lpi * 0.85, clamp(rawNeon.r + rawNeon.b * 0.4, 0.0, 1.0));
                float yDot = spotHalftoneDot(metricUV, 0.0,  lpi * 0.85, clamp(rawNeon.g + rawNeon.r * 0.4, 0.0, 1.0));

                float rosetteMask = clamp((cDot + mDot + yDot) * 0.55 * engraveMask, 0.08, 1.0);
                combinedInkMask = mix(combinedInkMask, combinedInkMask * rosetteMask, uEngravingMix);
            }

            // Lock final color to pure hyper-neon over #04010a obsidian ink
            vec3 faithfulRGB=clamp(rawNeon*uAcidOverdrive*0.55*combinedInkMask,0.0,1.0);
            vec3 finalRGB=mix(faithfulRGB,lockAcidNeon(rawNeon,combinedInkMask,uAcidOverdrive),clamp(uChromaLock,0.0,1.0));

            // Optional CRT Scanlines
            if (uDispersion > 0.01) {
                float scan = (sin(gl_FragCoord.y * PI) * 0.5 + 0.5) * 0.15 * min(uDispersion, 1.0);
                finalRGB *= (1.0 - scan);
            }

            // Vignette Frame
            float vig = 1.0 - smoothstep(0.75, 1.72, length(uv * 2.0 - 1.0));
            finalRGB *= mix(0.74, 1.0, vig);

            gl_FragColor = vec4(clamp(finalRGB, 0.0, 1.0), clamp(uPackOpacity,0.0,1.0));
        }