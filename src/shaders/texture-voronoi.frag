precision highp float;
uniform sampler2D u_palette;
uniform float uPalettePhase;
uniform float uPaletteMix;
uniform float u_layerOpacity;
vec3 paletteVault(float p){return texture2D(u_palette,vec2(fract(p+uPalettePhase),0.5)).rgb;}

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_density;
        uniform float u_moire;
        uniform float u_glitch;
        uniform float u_speed;
        uniform float u_colorPhase;

        // Hash function for randomness
        vec2 hash2(vec2 p) {
            p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
            return fract(sin(p) * 43758.5453);
        }

        float hash1(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        // Fractional Voronoi (Worley noise)
        // Returns vec3: x = min distance, y,z = ID of the closest cell
        vec3 voronoi(vec2 x, float t) {
            vec2 n = floor(x);
            vec2 f = fract(x);

            float md = 8.0; // minimum distance
            vec2 cid = vec2(0.0); // cell id

            // Check neighboring cells
            for(int j = -1; j <= 1; j++) {
                for(int i = -1; i <= 1; i++) {
                    vec2 g = vec2(float(i), float(j));
                    vec2 o = hash2(n + g); // random offset for point in cell
                    
                    // Animate the points
                    o = 0.5 + 0.5 * sin(t + 6.2831 * o);
                    
                    vec2 r = g + o - f; // vector from pixel to point
                    float d = dot(r, r); // distance squared (gives a more "acidic" geometric look than true distance)
                    
                    if(d < md) {
                        md = d;
                        cid = n + g;
                    }
                }
            }
            return vec3(md, cid);
        }

        // Generate the core texture pattern
        vec3 generatePattern(vec2 uv, float t) {
            // Get Voronoi data
            vec3 v = voronoi(uv * u_density, t);
            float dist = v.x;
            vec2 cellId = v.yz;

            // Hyper-neon color palette (Lisa Frank acid nightmare)
            vec3 c_pink = vec3(1.0, 0.0, 0.5);
            vec3 c_cyan = vec3(0.0, 1.0, 1.0);
            vec3 c_yellow = vec3(1.0, 1.0, 0.0);
            vec3 c_purple = vec3(0.4, 0.0, 1.0);

            // Assign color based on cell ID hash
            float cHash = fract(hash1(cellId) + u_colorPhase);
            vec3 baseColor;
            if(cHash < 0.25) baseColor = c_pink;
            else if(cHash < 0.50) baseColor = c_cyan;
            else if(cHash < 0.75) baseColor = c_yellow;
            else baseColor = c_purple;

            // Palette bank varies with changing Voronoi cell IDs, preserving discontinuous walls.
            baseColor=mix(baseColor,paletteVault(cHash),clamp(uPaletteMix,0.0,1.0));
            // High-frequency Moiré interference pattern based on distance and UVs
            float moire = sin(dist * u_moire) * cos((uv.x + uv.y) * u_moire * 0.5 + t);
            // Sharpen the interference lines
            float moireLine = smoothstep(0.0, 0.15, abs(moire));

            // Invert colors along the moiré lines for extreme contrast
            vec3 finalPattern = mix(vec3(1.0) - baseColor, baseColor, moireLine);
            
            // Add cellular borders
            finalPattern *= smoothstep(0.01, 0.05, dist);

            return finalPattern;
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            // Center and correct aspect ratio
            vec2 p = uv * 2.0 - 1.0;
            p.x *= u_resolution.x / u_resolution.y;

            float t = u_time * u_speed;

            // --- VHS GLITCH: Horizontal Tearing ---
            // Divide screen into horizontal bands
            float band = floor(uv.y * 30.0); 
            // Randomly offset some bands based on time and glitch intensity
            float tearOffset = (hash1(vec2(band, floor(t * 10.0))) - 0.5) * 0.2;
            // Only apply tear occasionally based on hash threshold
            if (hash1(vec2(band, 1.0)) < u_glitch * 0.3) {
                p.x += tearOffset * u_glitch;
            }

            // --- CHROMATIC ABERRATION ---
            // Offset coordinates for Red, Green, Blue channels
            float caOffset = 0.02 * u_glitch;
            vec2 p_r = p + vec2(caOffset, 0.0);
            vec2 p_g = p;
            vec2 p_b = p - vec2(caOffset, 0.0);

            // Fetch pattern for each channel to simulate RGB separation
            float r = generatePattern(p_r, t).r;
            float g = generatePattern(p_g, t).g;
            float b = generatePattern(p_b, t).b;

            vec3 color = vec3(r, g, b);

            // --- CRT SCANLINES ---
            // High frequency vertical sine wave mapped to screen Y
            float scanline = sin(gl_FragCoord.y * 2.0) * 0.08 * u_glitch;
            color -= scanline;

            // --- CRT FLICKER / VIGNETTE ---
            float flicker = 1.0 - (hash1(vec2(t, t)) * 0.1 * u_glitch);
            color *= flicker;

            // Vignette for depth
            float vignette = length(uv - 0.5) * 1.5;
            color *= 1.0 - (vignette * vignette * 0.3);

            gl_FragColor = vec4(clamp(color,0.0,1.0),clamp(u_layerOpacity,0.0,1.0));
        }
