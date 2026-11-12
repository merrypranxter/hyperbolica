precision highp float;
uniform sampler2D u_palette;
uniform float uPalettePhase;
uniform float uPaletteMix;
uniform float u_layerOpacity;
vec3 paletteVault(float p){return texture2D(u_palette,vec2(fract(p+uPalettePhase),0.5)).rgb;}

        // Uniforms passed from JavaScript
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_scale;
        uniform float u_speed;
        uniform float u_distortion;
        uniform float u_colorFreq;
        uniform float u_iterations;

        // Random hash for noise generation
        vec2 hash2(vec2 p) {
            p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
            return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
        }

        // 2D Simplex/Value Noise function
        float noise(vec2 p) {
            const float K1 = 0.366025404; // (sqrt(3)-1)/2;
            const float K2 = 0.211324865; // (3-sqrt(3))/6;
            
            vec2 i = floor(p + (p.x + p.y) * K1);
            vec2 a = p - i + (i.x + i.y) * K2;
            vec2 o = (a.x > a.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
            vec2 b = a - o + K2;
            vec2 c = a - 1.0 + 2.0 * K2;
            
            vec3 h = max(0.5 - vec3(dot(a, a), dot(b, b), dot(c, c)), 0.0);
            vec3 n = h * h * h * h * vec3(dot(a, hash2(i + 0.0)), dot(b, hash2(i + o)), dot(c, hash2(i + 1.0)));
            return dot(n, vec3(70.0));
        }

        // Fractional Brownian Motion (fBm) using ridged noise for more texture
        float fbm(vec2 p) {
            float f = 0.0;
            float amp = 0.5;
            float freq = 1.0;
            
            // Loop up to 10 times, break early based on UI slider
            for(int i = 0; i < 10; i++) {
                if(float(i) >= u_iterations) break;
                
                // Absolute value of noise creates sharp "ridges" for highly textural look
                float n = abs(noise(p * freq));
                // Invert and sharpen
                n = 1.0 - n; 
                n = n * n;
                
                f += amp * n;
                
                // Rotate and scale to prevent artifacts
                p = mat2(1.6, 1.2, -1.2, 1.6) * p;
                amp *= 0.5;
                freq *= 2.0;
            }
            return f;
        }

        // Cosine-based color palette
        vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
            return a + b * cos(6.28318 * (c * t + d));
        }

        void main() {
            // Normalize pixel coordinates (from 0 to 1) and center origin
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            uv = uv * 2.0 - 1.0;
            
            // Correct aspect ratio so circles don't become ovals
            uv.x *= u_resolution.x / u_resolution.y;

            // Apply global scale
            vec2 p = uv * u_scale;
            float t = u_time * u_speed;

            // DOMAIN WARPING (The secret to maximalist chaotic textures)
            // Layer 1
            vec2 q = vec2(0.0);
            q.x = fbm(p + vec2(0.0, 0.0) + t * 0.5);
            q.y = fbm(p + vec2(5.2, 1.3) - t * 0.4);

            // Layer 2
            vec2 r = vec2(0.0);
            r.x = fbm(p + u_distortion * q + vec2(1.7, 9.2) + 0.15 * t);
            r.y = fbm(p + u_distortion * q + vec2(8.3, 2.8) - 0.126 * t);

            // Final fBm value warped by previous layers
            float f = fbm(p + u_distortion * r);

            // COLOR MAPPING
            // Base vectors for the cosine palette, creating vibrant maximalist colors
            vec3 col_a = vec3(0.5, 0.5, 0.5);
            vec3 col_b = vec3(0.5, 0.5, 0.5);
            vec3 col_c = vec3(1.0, 1.0, 1.0) * u_colorFreq;
            vec3 col_d = vec3(0.0, 0.33, 0.67) + t * 0.2; // Phase shift for RGB + time animation

            // Calculate index into the palette based on space and warped values
            float colorIndex = f + length(q) * 0.5 + r.x * 0.2 - t * 0.1;

            // Get base color from palette
            vec3 finalColor=palette(colorIndex,col_a,col_b,col_c,col_d);
            finalColor=mix(finalColor,paletteVault(colorIndex*u_colorFreq),clamp(uPaletteMix,0.0,1.0));

            // Add high-frequency micro texture (adds extreme grit and detail)
            float microTex = noise(uv * 100.0 * u_scale + t);
            finalColor += microTex * 0.05;

            // Increase contrast / saturation for the maximalist look
            finalColor = smoothstep(0.0, 1.0, finalColor);
            finalColor = mix(finalColor, finalColor * finalColor * 1.5, 0.4);

            // Optional: Vignette to darken edges slightly for depth
            float vignette = 1.0 - smoothstep(0.5, 1.5, length(uv));
            finalColor *= mix(0.7, 1.0, vignette);

            gl_FragColor = vec4(clamp(finalColor,0.0,1.0),clamp(u_layerOpacity,0.0,1.0));
        }
