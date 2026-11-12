precision highp float;
        varying vec2 vUv;

        uniform sampler2D uPalette;
        uniform float uPalettePhase;
        uniform float uRayQuality;
        uniform float uChromaLock;
        uniform vec2 uResolution;
        uniform float uTime;
        uniform vec2  uMouse;
        uniform float uZoom;

        uniform float uSymmetry;
        uniform float u4DRotation;
        uniform float uApollonian;
        uniform float uChladniFreq;
        uniform float uVolumetricGlow;
        uniform float uSchlierenFreq;
        uniform float uFlySpeed;

        #define PI  3.14159265359
        #define TAU 6.28318530718
        #define PHI 1.61803398875

        // Safe Rational Tanh (Never overflows exp() into NaN or Infinity)
        vec3 safeTanh(vec3 x) {
            vec3 c = clamp(x, 0.0, 10.0);
            return c * (27.0 + c * c) / (27.0 + 9.0 * c * c);
        }

        // Peak-Channel Hue Lock: Forces colors to stay pure vivid neon (NEVER white!)
        vec3 lockNeonChroma(vec3 col, float chromaPow) {
            vec3 c = max(col, vec3(0.0));
            float peak = max(c.r, max(c.g, c.b));
            if (peak < 1e-4) return vec3(0.0);
            vec3 normCol = c / peak;
            // Suppress the minimum channel so R, G, and B can never all be 1.0 simultaneously
            float minCh = min(normCol.r, min(normCol.g, normCol.b));
            normCol = clamp((normCol - minCh * 0.78) / max(1.0 - minCh * 0.78, 0.05), 0.0, 1.0);
            return pow(normCol, vec3(chromaPow));
        }

        // 2D Rotation Matrix
        mat2 rot2D(float a) {
            float s = sin(a), c = cos(a);
            return mat2(c, -s, s, c);
        }

        // Smooth Minimum for organic biomineral fusion
        float smin(float a, float b, float k) {
            float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
            return mix(b, a, h) - k * h * (1.0 - h);
        }

        // Non-Euclidean Twisting Cathedral Flight Path
        vec2 tunnelPath(float z) {
            return vec2(
                sin(z * 0.22) * 1.15 + cos(z * 0.11) * 0.35,
                cos(z * 0.18) * 1.05 + sin(z * 0.09) * 0.35
            );
        }

        // N-Fold Dihedral Kaleidoscopic Plane Folding
        vec2 foldKaleido(vec2 p, float nSides) {
            float r = length(p);
            float a = atan(p.y, p.x);
            float sector = TAU / clamp(nSides, 3.0, 24.0);
            a = mod(a + 0.5 * sector, sector) - 0.5 * sector;
            a = sqrt(a * a + 1e-5);
            return vec2(cos(a), sin(a)) * r;
        }

        // High-Contrast Lisa Frank / 1980s New Wave Pure Neon Palette (Zero White Floor)
        vec3 nematicPalette(float phase) {
            return texture2D(uPalette,vec2(fract(phase+uPalettePhase),0.5)).rgb;
        }

        // 4D Stereographic Polychoron + Apollonian-Mandelbox + Chladni Diatom SDF
        vec4 evaluate4DCathedral(vec3 pos, out float outScale) {
            vec2 centerXY = tunnelPath(pos.z);
            vec2 localXY = pos.xy - centerXY;

            // Interactive twist along Z
            localXY *= rot2D(pos.z * 0.10 + uMouse.x * 0.75);

            // Safety flight clearance cylinder so camera flies cleanly down the central nave
            float radialDist = length(localXY);
            float tunnelClearance = radialDist - 0.62;

            // Lift 3D point into 4D phase space (R^4)
            vec4 p4 = vec4(
                localXY,
                mod(pos.z + 2.0, 4.0) - 2.0,
                sin(pos.z * 0.55 + uTime * 0.45) * 0.65
            );

            // Apply 4D Double-Isoclinic Rotation across (XW), (YZ), and (ZW) planes
            float rotAngle = uTime * 0.28 * u4DRotation + u4DRotation * 0.75;
            p4.xw *= rot2D(rotAngle);
            p4.yz *= rot2D(rotAngle * 0.78);
            p4.zw *= rot2D(rotAngle * 0.53);

            // Initial N-fold dihedral kaleidoscope symmetry on XY
            p4.xy = foldKaleido(p4.xy, uSymmetry);

            float scale = 1.0;
            vec3 orbitTrap = vec3(1e5);
            float apolloFactor = clamp(uApollonian, 0.20, 2.50);

            // 5-Iteration 4D Apollonian-Mandelbox Cascade with bounded derivative scale
            for (int i = 0; i < 5; i++) {
                p4 = clamp(p4, -0.95, 0.95) * 2.0 - p4;

                if (i == 1) {
                    p4.xy = abs(p4.xy);
                    p4.xy *= rot2D(0.42 * u4DRotation);
                }

                // Bounded Spherical Apollonian Conformal Inversion
                float r2 = dot(p4, p4);
                float k = clamp((0.85 + 0.45 * apolloFactor) / clamp(r2, 0.22, 1.15), 1.0, 2.35);
                p4 *= k;
                scale = scale * k + 0.5;

                // Constant 4D polychoron offset
                p4 -= vec4(0.52, 0.44, 0.38, 0.22);

                // Track closest harmonic approach for orbit-trap coloring
                orbitTrap.x = min(orbitTrap.x, length(p4.xy));
                orbitTrap.y = min(orbitTrap.y, length(p4.zw));
                orbitTrap.z = min(orbitTrap.z, abs(p4.x - p4.y) + abs(p4.z));
            }

            // Normalized scale divisor prevents step-size collapse at high uApollonian
            float normScale = clamp(scale, 1.0, 28.0);
            float fractalDist = (length(p4.xyz) - 1.22) / normScale;

            // 3D Chladni Standing Wave & Gyroidal Diatom Silica Lattice
            vec3 cp = p4.xyz * (0.35 + uChladniFreq * 0.14);
            float chladni = cos(cp.x) * cos(cp.y) + cos(cp.y) * cos(cp.z) + cos(cp.z) * cos(cp.x);
            float gyroid  = sin(cp.x * PHI) * cos(cp.y * PHI) + sin(cp.y * PHI) * cos(cp.z * PHI) + sin(cp.z * PHI) * cos(cp.x * PHI);

            float diatomShell = (abs(chladni) - 0.28 * abs(gyroid)) * 0.14;
            float d = smin(fractalDist, fractalDist + diatomShell, 0.05);

            // Carve open the central flight corridor
            d = max(d, -tunnelClearance);

            outScale = normScale;
            return vec4(d, orbitTrap);
        }

        float mapDistanceOnly(vec3 pos) {
            float dummyScale;
            return evaluate4DCathedral(pos, dummyScale).x;
        }

        // Tetrahedral 3D Surface Normal Calculation
        vec3 calcNormal(vec3 pos) {
            vec2 e = vec2(0.003, -0.003);
            return normalize(
                e.xyy * mapDistanceOnly(pos + e.xyy) +
                e.yyx * mapDistanceOnly(pos + e.yyx) +
                e.yxy * mapDistanceOnly(pos + e.yxy) +
                e.xxx * mapDistanceOnly(pos + e.xxx)
            );
        }

        // Active-Matter Nematic Liquid Crystal Director Field & Cross-Polarized Schlieren Birefringence
        vec3 computeNematicSchlieren(vec3 pos, vec3 normal, vec3 viewDir, float jacobianScale, vec3 trap, out float outDarkInkMask) {
            vec2 q1 = pos.xy * 2.4 + vec2(sin(pos.z * 0.65 + uTime * 0.7), cos(pos.z * 0.55 - uTime * 0.6));
            vec2 q2 = pos.yz * 2.1 - vec2(cos(pos.x * 0.75 - uTime * 0.5), sin(pos.x * 0.85 + uTime * 0.8));

            // Topological disclination defects (+1/2 and -1/2 nematic vortices)
            float defectPlus  = 0.5 * atan(sin(q1.y * 2.5 + uTime), cos(q1.x * 2.5 - uTime));
            float defectMinus = -0.5 * atan(sin(q2.x * 2.2 - uTime * 0.8), cos(q2.y * 2.2 + uTime * 0.9));
            float curlStream  = sin(dot(pos, vec3(2.8, -2.4, 2.2)) + uTime * 1.3);

            // Total Nematic Director Angle (theta)
            float theta = defectPlus + defectMinus + curlStream * 0.85;

            // Cross-Polarized Schlieren Extinction Brushes: I_brush = sin^2(2 * theta)
            // Where sin^2(2*theta) approaches 0, carve deep black-ink structural brushes!
            float schlierenBrush = pow(sin(2.0 * theta), 2.0);
            float schlierenInk = smoothstep(0.06, 0.52, schlierenBrush);

            // Chladni Diatom Silica Black-Ink Nodal Contours
            float chladniContour = sin((trap.x * 3.5 + trap.y * 2.5) * uChladniFreq * 0.5);
            float diatomInk = smoothstep(0.08, 0.42, abs(chladniContour));

            // Combined Black-Ink Structural Webbing (guarantees 35%+ deep obsidian contrast)
            outDarkInkMask = mix(0.04, 1.0, schlierenInk * diatomInk);

            // Optical Phase Retardation (delta)
            float fresnel = 1.0 - max(dot(normal, viewDir), 0.0);
            float logStress = log(1.0 + jacobianScale) * 0.42;
            float retardation = (logStress + fresnel * 1.45 + trap.x * 0.95 - trap.y * 0.65) * uSchlierenFreq * 0.18 - uTime * 0.16;

            // Sample dispersed interference spectrum and lock to pure neon hues
            vec3 colR = nematicPalette(retardation + 0.06);
            vec3 colG = nematicPalette(retardation);
            vec3 colB = nematicPalette(retardation - 0.06);
            vec3 interferenceRGB = vec3(colR.r, colG.g, colB.b);

            return interferenceRGB * outDarkInkMask;
        }

        void main() {
            vec2 uv = vUv * 2.0 - 1.0;
            uv.x *= uResolution.x / max(uResolution.y, 1.0);

            // --- 1. CAMERA & NON-EUCLIDEAN TUNNEL RIG ---
            float camZ = uTime * uFlySpeed * 2.0;
            vec2 camCenter = tunnelPath(camZ);
            vec3 ro = vec3(camCenter, camZ);

            float targetZ = camZ + 1.8;
            vec2 targetCenter = tunnelPath(targetZ);
            vec3 lookAt = vec3(
                targetCenter.x + uMouse.x * 1.10,
                targetCenter.y + uMouse.y * 1.10,
                targetZ
            );

            vec3 forward = normalize(lookAt - ro);
            vec3 right   = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
            vec3 up      = cross(forward, right);

            float bankAngle = -(targetCenter.x - camCenter.x) * 0.35 + uMouse.x * 0.25;
            right = normalize(right * cos(bankAngle) + up * sin(bankAngle));
            up    = cross(forward, right);

            float fov = 1.15 / clamp(uZoom, 0.35, 3.5);
            vec3 rd = normalize(uv.x * right + uv.y * up + fov * forward);

            // --- 2. 56-STEP VOLUMETRIC RAYMARCH LOOP (BOUNDED & HUE-LOCKED) ---
            float t = 0.12;
            float maxDist = 15.0;
            float rayStride = (uRayQuality < 0.5 ? 1.8 : uRayQuality < 1.5 ? 1.2 : 0.75);
            float hitScale = 1.0;
            vec3  hitTrap = vec3(0.0);
            bool  hitSurface = false;

            vec3 volColorAccum = vec3(0.0);
            float volWeightAccum = 0.0;

            for (int i = 0; i < 56; i++) {
                if(float(i)>=mix(22.0,56.0,clamp(uRayQuality/2.0,0.0,1.0)))break;
                vec3 p = ro + rd * t;
                float stepScale;
                vec4 res = evaluate4DCathedral(p, stepScale);
                float d = res.x;
                vec3 trap = res.yzw;

                // Step-weighted volumetric bioluminescence (bounded so it can never explode to infinity)
                float stepLen = clamp(abs(d) * 0.72, 0.018, 0.35) * rayStride;
                float shellGlow = exp(-abs(d) * 9.5) * stepLen;

                // Carve dark Chladni & Kaleidoscopic ribbons inside the volumetric glow itself
                float volMod = smoothstep(0.15, 0.75, abs(sin(trap.x * uChladniFreq + p.z * 1.5)));
                float w = shellGlow * volMod;

                float plasmaPhase = trap.x * 0.55 - trap.y * 0.35 + p.z * 0.10 - uTime * 0.22 + float(i) * 0.015;
                vec3 stepNeon = nematicPalette(plasmaPhase);

                volColorAccum += stepNeon * w;
                volWeightAccum += w;

                if (d < 0.0028) {
                    hitSurface = true;
                    hitScale = stepScale;
                    hitTrap = trap;
                    break;
                }

                if (t > maxDist) {
                    hitScale = stepScale;
                    hitTrap = trap;
                    break;
                }

                t += stepLen;
            }

            // --- 3. SURFACE SHADING & DEEP OBSIDIAN-NEON COMPOSITING ---
            vec3 viewDir = -rd;
            vec3 voidObsidian = vec3(0.02, 0.005, 0.05);
            vec3 finalColor = voidObsidian;

            // Compute Horizon Mandala with deep black-ink spokes
            float angle = atan(rd.y, rd.x);
            float radius = length(rd.xy);
            float spokeWave = sin(angle * uSymmetry + uTime * 1.1);
            float ringWave  = cos(radius * 16.0 - uTime * 2.2);
            float horizonMask = smoothstep(0.05, 0.65, abs(spokeWave * ringWave));
            vec3 horizonMandala = nematicPalette(spokeWave * 0.35 + radius * 0.9 - uTime * 0.18) * horizonMask * 0.65;

            if (hitSurface) {
                vec3 hitPos = ro + rd * t;
                vec3 N = calcNormal(hitPos);

                float darkInkMask;
                vec3 nematicSkin = computeNematicSchlieren(hitPos, N, viewDir, hitScale, hitTrap, darkInkMask);

                // Dual moving point lights inside the cathedral
                vec3 lightPos1 = ro + vec3(sin(uTime * 1.3) * 0.8, cos(uTime * 1.1) * 0.8, 1.4);
                vec3 lightPos2 = ro + vec3(-cos(uTime * 0.9) * 0.8, sin(uTime * 1.4) * 0.8, 3.0);

                vec3 L1 = normalize(lightPos1 - hitPos);
                vec3 L2 = normalize(lightPos2 - hitPos);
                vec3 H1 = normalize(L1 + viewDir);
                vec3 H2 = normalize(L2 + viewDir);

                float diff1 = max(dot(N, L1), 0.0);
                float diff2 = max(dot(N, L2), 0.0);
                float spec1 = pow(max(dot(N, H1), 0.0), 40.0);
                float spec2 = pow(max(dot(N, H2), 0.0), 28.0);
                float fresnel = pow(1.0 - max(dot(N, viewDir), 0.0), 2.6);

                // Deep crevice occlusion from fractal orbit trap
                float creviceAO = smoothstep(0.02, 0.48, hitTrap.z);

                vec3 surfaceRGB = nematicSkin * (0.28 + 0.72 * (diff1 * 0.7 + diff2 * 0.5)) * creviceAO;

                // Colored neon specular highlights (tinted with shifted palette instead of pure white)
                vec3 specCol1 = nematicPalette(hitTrap.x * 0.8 + 0.33);
                vec3 specCol2 = nematicPalette(hitTrap.y * 0.8 + 0.67);
                surfaceRGB += specCol1 * spec1 * 0.75 * darkInkMask;
                surfaceRGB += specCol2 * spec2 * 0.65 * darkInkMask;

                // Iridescent Fresnel rim light
                vec3 rimCol = nematicPalette(hitTrap.x * 1.1 + fresnel * 0.5 - uTime * 0.2);
                surfaceRGB += rimCol * fresnel * 0.95 * creviceAO;

                // Distance fog into deep dark horizon mandala
                float fogFactor = exp(-t * 0.16);
                finalColor = mix(horizonMandala, surfaceRGB, fogFactor);
            } else {
                finalColor = horizonMandala;
            }

            // --- 4. HUE-LOCKED VOLUMETRIC PLASMA INJECTION (CANNOT WHITEOUT) ---
            if (volWeightAccum > 1e-4 && uVolumetricGlow > 0.01) {
                vec3 avgVolHue = clamp(volColorAccum / volWeightAccum,0.0,1.0);
                // Softly saturate plasma intensity using rational curve so it never exceeds 0.85
                float rawGlowAmt = volWeightAccum * uVolumetricGlow * 1.35;
                float boundedGlow = rawGlowAmt / (1.0 + rawGlowAmt);

                // Blend plasma additively in dark areas while preserving black-ink structural contrast
                float structureShadow = smoothstep(0.0, 0.35, sin(length(uv) * uChladniFreq * 1.5 - uTime * 2.0) * 0.5 + 0.5);
                finalColor = mix(finalColor, max(finalColor, avgVolHue * (0.55 + 0.40 * structureShadow)), boundedGlow * 0.72);
            }

            // Final anti-whiteout chroma lock & [0, 1] clamp
            vec3 toned = safeTanh(finalColor * 1.15);
            float minChannel = min(toned.r, min(toned.g, toned.b));
            // Strip any residual grey/white floor above 0.35 so colors remain deep dark & hyper-neon
            toned -= max(minChannel - 0.28, 0.0) * 0.85 * uChromaLock;

            gl_FragColor = vec4(clamp(toned, 0.0, 1.0), 1.0);
        }
