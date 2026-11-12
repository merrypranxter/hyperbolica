attribute vec4 a_particleData; // x: idFrac (0..1), y: goldenAngle, z: shellRadius, w: glyphType (0..3)

        uniform vec2  uResolution;
        uniform float uTime;
        uniform vec2  uMouse;
        uniform float uZoom;
        uniform float uEngineMorph;
        uniform float uSymmetry;
        uniform float uTwist;
        uniform float uSwarmMix;
        uniform float uDpr;

        varying float vGlyphType;
        varying float vColorSeed;
        varying float vAlpha;

        #define PI  3.14159265359
        #define TAU 6.28318530718
        #define PHI 1.61803398875

        void main() {
            float idFrac = a_particleData.x;
            float gAngle = a_particleData.y;
            float rShell = a_particleData.z;
            vGlyphType   = a_particleData.w;

            float t = uTime * 0.55;
            float nSym = clamp(uSymmetry, 3.0, 24.0);

            // 1. Phyllotaxis Golden-Ratio Spiral & Crop-Circle Orbital Ring Position
            float orbitAngle = gAngle + t * (0.35 + 0.65 * (1.0 - rShell)) * (mod(floor(idFrac * 12000.0), 2.0) < 0.5 ? 1.0 : -1.0);
            float cymaticMod = 0.14 * sin(orbitAngle * nSym + t * 2.0 + uTwist);
            float radius = (0.08 + rShell * 1.15 + cymaticMod);

            vec2 phylloPos = vec2(cos(orbitAngle), sin(orbitAngle)) * radius;

            // 2. Thomas Cyclically Symmetric Strange Attractor Streamlines
            float phase3D = idFrac * TAU * 29.0 + t * 1.2;
            vec3 thomas = vec3(
                sin(phase3D + sin(orbitAngle * 3.0)),
                sin(phase3D * PHI + cos(orbitAngle * 2.0)),
                cos(phase3D / PHI - sin(orbitAngle * 4.0))
            );
            vec2 attractorPos = thomas.xy * (0.55 + 0.35 * cos(thomas.z * PI + uTwist));

            // Cross-morph particle trajectories based on active Engine
            float attractorBlend = 0.35 + 0.30 * sin(uEngineMorph * PI * 0.5);
            vec2 pos = mix(phylloPos, attractorPos, attractorBlend);

            // Interactive mouse gravity swirl
            vec2 toMouse = pos - uMouse * 0.5;
            float mDist = length(toMouse) + 0.15;
            pos += vec2(-toMouse.y, toMouse.x) * (0.08 / mDist) * sin(t * 2.0);

            // Aspect & Zoom projection
            float aspect = uResolution.x / max(uResolution.y, 1.0);
            vec2 screenPos = pos * clamp(uZoom, 0.35, 3.5);
            screenPos.x /= aspect;

            vColorSeed = fract(idFrac * 7.3 + rShell * 1.9 - t * 0.15);
            vAlpha = clamp(uSwarmMix * (0.45 + 0.45 * sin(idFrac * 150.0 + t * 3.5)), 0.0, 0.92);

            gl_Position = vec4(screenPos, 0.0, 1.0);
            gl_PointSize = clamp((3.2 + 5.8 * fract(idFrac * 97.1)) * uSwarmMix * uDpr, 1.0, 22.0);
        }
