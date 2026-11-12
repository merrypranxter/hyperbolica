precision highp float;
        varying vec2 vUv;

        uniform sampler2D uCurrentSceneTex;
        uniform sampler2D uHistoryTex;
        uniform vec2      uResolution;
        uniform float     uTime;
        uniform vec2      uMouse;
        uniform float     uFeedback;
        uniform float uCurlStrength;
        uniform vec2 uDragVelocity;
        uniform float uDragEnergy;
        uniform float     uSchlierenFreq;

        // 2D Simplex-style Value Noise for Curl Velocity Field
        float hash12(vec2 p) {
            vec3 p3 = fract(vec3(p.xyx) * 0.1031);
            p3 += dot(p3, p3.yzx + 33.33);
            return fract((p3.x + p3.y) * p3.z);
        }

        float valueNoise(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            float a = hash12(i);
            float b = hash12(i + vec2(1.0, 0.0));
            float c = hash12(i + vec2(0.0, 1.0));
            float d = hash12(i + vec2(1.0, 1.0));
            return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        // Scalar Potential for Divergence-Free 2D Curl Noise
        float streamPotential(vec2 p, float t) {
            float n1 = valueNoise(p * 3.2 + vec2(t * 0.35, -t * 0.28));
            float n2 = valueNoise(p * 6.8 - vec2(t * 0.55, t * 0.42)) * 0.5;
            return n1 + n2;
        }

        // Compute 2D Curl Vector: (dPsi/dy, -dPsi/dx)
        vec2 computeCurlVelocity(vec2 p, float t) {
            float eps = 0.01;
            float dPsiDy = (streamPotential(p + vec2(0.0, eps), t) - streamPotential(p - vec2(0.0, eps), t)) / (2.0 * eps);
            float dPsiDx = (streamPotential(p + vec2(eps, 0.0), t) - streamPotential(p - vec2(eps, 0.0), t)) / (2.0 * eps);
            return vec2(dPsiDy, -dPsiDx);
        }

        void main() {
            vec3 currentRGB = clamp(texture2D(uCurrentSceneTex, vUv).rgb, 0.0, 1.0);

            if (uFeedback <= 0.005) {
                gl_FragColor = vec4(currentRGB, 1.0);
                return;
            }

            vec2 centered = vUv - 0.5 - uMouse * 0.15;
            float aspect = uResolution.x / max(uResolution.y, 1.0);
            vec2 aspectP = vec2(centered.x * aspect, centered.y);

            // 1. Divergence-free Curl-Noise Velocity Field
            vec2 curlVel = computeCurlVelocity(aspectP * 1.45, uTime);

            // 2. Subtle Radial Zoom & Spiral Vortex Drift
            float dist = length(centered);
            vec2 radialDrift = -centered * 0.0055;
            vec2 tangentDrift = vec2(-centered.y, centered.x) * 0.0038 * sin(dist * 8.0 - uTime);

            vec2 toGesture=aspectP-vec2(uMouse.x*aspect*0.5,uMouse.y*0.5);
            float nearGesture=exp(-dot(toGesture,toGesture)*8.0);
            vec2 draggedFlow=uDragVelocity*0.019*nearGesture;
            vec2 vortex=vec2(-toGesture.y,toGesture.x)*uDragEnergy*0.008/(0.25+length(toGesture));
            vec2 totalOffset=(curlVel*0.0045*uCurlStrength+radialDrift+tangentDrift+draggedFlow+vortex)*(0.6+0.6*uFeedback);

            // Sample RGB channels from history buffer with slight chromatic phase separation
            float trailDisp = 0.0018 * uFeedback;
            vec2 uvHistR = clamp(vUv + totalOffset * (1.0 + uSchlierenFreq * 0.015) + vec2(trailDisp, 0.0), 0.002, 0.998);
            vec2 uvHistG = clamp(vUv + totalOffset, 0.002, 0.998);
            vec2 uvHistB = clamp(vUv + totalOffset * (1.0 - uSchlierenFreq * 0.015) - vec2(trailDisp, 0.0), 0.002, 0.998);

            vec3 historyRGB = vec3(
                texture2D(uHistoryTex, uvHistR).r,
                texture2D(uHistoryTex, uvHistG).g,
                texture2D(uHistoryTex, uvHistB).b
            );

            // Energy-attenuated hue rotation (row sum < 0.90 so trails NEVER accumulate to white)
            vec3 rotatedHistory = vec3(
                dot(historyRGB, vec3(0.82, 0.08, 0.00)),
                dot(historyRGB, vec3(0.00, 0.82, 0.08)),
                dot(historyRGB, vec3(0.08, 0.00, 0.82))
            );

            // Strip any grey/white floor from history buffer so trails decay to deep neon & black
            float histMin = min(rotatedHistory.r, min(rotatedHistory.g, rotatedHistory.b));
            rotatedHistory = max(rotatedHistory - histMin * 0.55, vec3(0.0));

            vec3 decayedHistory = rotatedHistory * (0.90 * uFeedback);
            // Preserve a portion of true warped history rather than simply brightening the current frame.
            vec3 ghost=mix(currentRGB,rotatedHistory*0.94,uFeedback*0.57);
            vec3 blended=mix(ghost,max(ghost,decayedHistory),uFeedback*0.60);

            gl_FragColor = vec4(clamp(blended, 0.0, 1.0), 1.0);
        }
