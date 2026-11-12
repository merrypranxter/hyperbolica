precision highp float;
        varying vec2 vUv;

        uniform sampler2D uAccumulatedTex;
        uniform vec2      uResolution;
        uniform float     uTime;
        uniform sampler2D uPalette;
        uniform float uPalettePhase;
        uniform float uPaletteInkMix;
        uniform float uHalftoneMix;
        uniform float     uHalftoneScale;
        uniform float     uAcidOverdrive;
        uniform float     uDispersion;

        #define PI  3.14159265359
        #define TAU 6.28318530718

        float hash12(vec2 p) {
            vec3 p3 = fract(vec3(p.xyx) * 0.1031);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        mat2 rot2D(float a) {
            float s = sin(a), c = cos(a);
            return mat2(c, -s, s, c);
        }

        // Safe Rational Tanh (No exp() overflow)
        vec3 safeTanh(vec3 x) {
            vec3 c = clamp(x, 0.0, 10.0);
            return c * (27.0 + c * c) / (27.0 + 9.0 * c * c);
        }

        // Authentic Rotated Screen-Print Halftone Dot Cell Function (Black-Garment Substrate)
        float halftoneDotScreen(vec2 metricUV, float angleDeg, float lpiScale, float spotIntensity) {            float rad = angleDeg * (PI / 180.0);
            vec2 gridUV = rot2D(rad) * metricUV * lpiScale;
            vec2 cell = fract(gridUV) - 0.5;
            float dist = length(cell) * 1.41421356; // 0.0 at center, 1.0 at cell corner
            // Max radius capped at 0.78 so dark black garment webbing ALWAYS remains visible between dots!
            float radius = sqrt(clamp(spotIntensity, 0.0, 1.0)) * 0.78;
            return 1.0 - smoothstep(radius - 0.12, radius + 0.12, dist);
        }

        void main() {
            vec2 uv = vUv;
            vec2 metricUV = uv - 0.5;
            metricUV.x *= uResolution.x / max(uResolution.y, 1.0);

            // --- 1. VHS HORIZONTAL TRACKING TEAR & CHROMATIC DISPERSION ---
            if (uDispersion > 0.001) {
                float band = floor(uv.y * 45.0 - uTime * 6.0);
                float tearRand = hash12(vec2(band, floor(uTime * 15.0)));
                float tearMask = step(0.91 - min(uDispersion, 1.2) * 0.14, tearRand);
                float tearShift = (hash12(vec2(uv.y * 90.0, uTime)) - 0.5) * 0.07 * uDispersion * tearMask;
                float tapeWave = sin(uv.y * 30.0 + uTime * 10.0) * 0.003 * uDispersion;
                uv.x = clamp(uv.x + tearShift + tapeWave, 0.001, 0.999);
            }

            // Radial + Horizontal Prismatic Dispersion
            vec2 radialVec = uv - 0.5;
            vec2 dispOffset = (radialVec * 0.015 + vec2(0.005, 0.0)) * uDispersion;

            vec3 colR = texture2D(uAccumulatedTex, clamp(uv + dispOffset, 0.001, 0.999)).rgb;
            vec3 colG = texture2D(uAccumulatedTex, uv).rgb;
            vec3 colB = texture2D(uAccumulatedTex, clamp(uv - dispOffset, 0.001, 0.999)).rgb;

            vec3 baseRGB = clamp(vec3(colR.r, colG.g, colB.b), 0.0, 1.0);

            // --- 2. DARK-GROUND SPOT-NEON SCREEN-PRINT HALFTONE ROSETTE ENGINE ---
            // Prints 4 fluorescent spot-neon plastisol plates onto a deep obsidian black substrate
            if (uHalftoneMix > 0.005) {
                // Extract 4 Spot-Neon Ink Plate Intensities directly from the vivid scene channels
                float cyanSpot    = clamp(baseRGB.b * 0.72 + baseRGB.g * 0.48 - baseRGB.r * 0.25, 0.0, 1.0);
                float magentaSpot = clamp(baseRGB.r * 0.78 + baseRGB.b * 0.42 - baseRGB.g * 0.25, 0.0, 1.0);
                float limeYelSpot = clamp(baseRGB.g * 0.75 + baseRGB.r * 0.45 - baseRGB.b * 0.30, 0.0, 1.0);
                float violetSpot  = clamp(max(baseRGB.r, baseRGB.b) * 0.75, 0.0, 1.0);

                // Standard Lithographic Rosette Screen Angles:
                // Cyan = 15 deg, Magenta = 75 deg, Lime/Yellow = 0 deg, Electric Violet = 45 deg
                float dotC = halftoneDotScreen(metricUV, 15.0, uHalftoneScale, cyanSpot);
                float dotM = halftoneDotScreen(metricUV, 75.0, uHalftoneScale, magentaSpot);
                float dotY = halftoneDotScreen(metricUV, 0.0,  uHalftoneScale, limeYelSpot);
                float dotV = halftoneDotScreen(metricUV, 45.0, uHalftoneScale * 0.7071, violetSpot);

                // Deep Obsidian Black Screen-Print Garment Substrate (NEVER white paper!)
                vec3 blackSubstrate = vec3(0.02, 0.005, 0.045);
                vec3 spotPrint = blackSubstrate;

                // Screen-print each spot-neon plastisol ink plate using max/screen ink layering
                vec3 inkCyan    = vec3(0.00, 0.96, 1.00) * dotC * (0.35 + 0.85 * cyanSpot);
                vec3 inkMagenta = vec3(1.00, 0.00, 0.55) * dotM * (0.35 + 0.85 * magentaSpot);
                vec3 inkLimeYel = vec3(0.72, 1.00, 0.00) * dotY * (0.35 + 0.85 * limeYelSpot);
                vec3 inkViolet  = vec3(0.58, 0.00, 1.00) * dotV * 0.55;

                // Combine spot plates while carving dark moiré interference fringes between dots
                spotPrint = max(spotPrint, inkViolet);
                spotPrint = max(spotPrint, inkCyan);
                spotPrint = max(spotPrint, inkMagenta);
                spotPrint += inkLimeYel * 0.65;

                // Carve secondary geometric Moiré interference grid lines
                float moireX = sin((metricUV.x * cos(0.26) - metricUV.y * sin(0.26)) * uHalftoneScale * PI);
                float moireY = sin((metricUV.x * cos(1.30) - metricUV.y * sin(1.30)) * uHalftoneScale * PI);
                float moireWeb = smoothstep(-0.35, 0.45, moireX * moireY);

                spotPrint *= mix(0.22, 1.18, moireWeb);

                baseRGB = mix(baseRGB, spotPrint, uHalftoneMix);
            }

            // --- 3. SPECTRAL ACID CHROMA OVERDRIVE (BOOSTS CHROMA, NEVER WHITEOUT!) ---
            float luma = dot(baseRGB, vec3(0.299, 0.587, 0.114));
            vec3 chromaVec = baseRGB - vec3(luma);

            // Amplify chromatic separation away from neutral grey/white
            vec3 overdriven = vec3(luma * 0.78) + chromaVec * (0.85 + 0.65 * uAcidOverdrive);
            overdriven = max(overdriven, vec3(0.0));

            // Anti-Whiteout Guard: If all 3 RGB channels rise together, subtract the white floor
            float commonWhite = min(overdriven.r, min(overdriven.g, overdriven.b));
            overdriven -= max(commonWhite - 0.24, 0.0) * 0.90;

            vec3 finalRGB = safeTanh(overdriven * (0.90 + 0.15 * uAcidOverdrive));

            // Optional CRT Scanlines & Film Grain when Dispersion > 0
            if (uDispersion > 0.01) {
                float scanline = (sin(gl_FragCoord.y * PI) * 0.5 + 0.5) * 0.16 * min(uDispersion, 1.0);
                finalRGB *= (1.0 - scanline);
            }

            // Crisp Dark Vignette Frame
            float vig = 1.0 - smoothstep(0.68, 1.68, length(vUv * 2.0 - 1.0));
            finalRGB *= mix(0.75, 1.0, vig);

            gl_FragColor = vec4(clamp(finalRGB, 0.0, 1.0), 1.0);
        }
