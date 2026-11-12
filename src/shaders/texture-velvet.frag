precision highp float;
uniform sampler2D u_palette;
uniform float uPalettePhase;
uniform float uPaletteMix;
uniform float u_layerOpacity;
vec3 paletteVault(float p){return texture2D(u_palette,vec2(fract(p+uPalettePhase),0.5)).rgb;}

        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_density;
        uniform float u_sheen;
        uniform float u_glow;
        uniform float u_phase;

        // --- Math & Noise Functions ---
        vec2 hash( vec2 p ) {
            p = vec2( dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)) );
            return -1.0 + 2.0*fract(sin(p)*43758.5453123);
        }

        // 2D Simplex Noise
        float noise( in vec2 p ) {
            const float K1 = 0.366025404; 
            const float K2 = 0.211324865; 
            vec2  i = floor( p + (p.x+p.y)*K1 );
            vec2  a = p - i + (i.x+i.y)*K2;
            float m = step( a.y, a.x ); 
            vec2  o = vec2( m, 1.0-m );
            vec2  b = a - o + K2;
            vec2  c = a - 1.0 + 2.0*K2;
            vec3  h = max( 0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
            vec3  n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
            return dot( n, vec3(70.0) );
        }

        // --- Procedural Terrain: Ridge Noise ---
        // Creates sharp, vein-like branching structures simulating matted fur or mycelium
        float ridgeFBM(vec2 p, float t) {
            float f = 0.0;
            float amp = 0.5;
            float freq = 1.0;
            float weight = 1.0;
            
            // Domain warp for organic swirling
            p += vec2(sin(p.y * 0.5 + t * 0.2), cos(p.x * 0.5 - t * 0.3));

            for (int i = 0; i < 6; i++) {
                // Absolute noise creates a sharp valley at 0.
                float n = abs(noise(p * freq));
                // Invert it to make it a sharp ridge
                n = 1.0 - n;
                // Square it to sharpen the peaks further
                n *= n;
                // Weight by previous octave to make crests sharper than valleys
                n *= weight;
                weight = max(min(n * 2.0, 1.0), 0.0);
                
                f += amp * n;
                
                // Rotate to break up grid artifacts
                p = mat2(0.8, 0.6, -0.6, 0.8) * p;
                amp *= 0.5;
                freq *= 2.0;
            }
            return f;
        }

        // Height sampling
        float getHeight(vec2 p, float t) {
            return ridgeFBM(p * u_density, t);
        }

        // Calculate Surface Normal
        vec3 getNormal(vec2 p, float t) {
            float eps = 0.002;
            float h0 = getHeight(p, t);
            float hX = getHeight(p + vec2(eps, 0.0), t);
            float hY = getHeight(p + vec2(0.0, eps), t);
            
            vec3 n = vec3(h0 - hX, h0 - hY, eps * 5.0);
            return normalize(n);
        }

        // 80s Glam Cosine Palette (Hot Pink, Cyan, Violet, Yellow)
        vec3 palette(float t) {
            vec3 a = vec3(0.5, 0.5, 0.5);
            vec3 b = vec3(0.5, 0.5, 0.5);
            vec3 c = vec3(1.0, 1.0, 1.0);
            // Specific phase offsets for aggressive neon aesthetic
            vec3 d = vec3(0.0, 0.33, 0.67) + u_phase; 
            vec3 originalPalette=a+b*cos(6.28318*(c*t+d));
            return mix(originalPalette,paletteVault(t),clamp(uPaletteMix,0.0,1.0));
        }

        void main() {
            vec2 uv = gl_FragCoord.xy / u_resolution.xy;
            vec2 p = uv * 2.0 - 1.0;
            p.x *= u_resolution.x / u_resolution.y;
            
            float t = u_time * 0.4;

            // Geometry
            float height = getHeight(p, t);
            vec3 normal = getNormal(p, t);
            vec3 viewDir = vec3(0.0, 0.0, 1.0);

            // --- TANGENT CALCULATION FOR ANISOTROPY ---
            // Create a swirly reference direction across the 2D plane
            vec3 flowDir = normalize(vec3(sin(p.y * 3.0 + t), cos(p.x * 3.0 - t), 0.0));
            // Project the flow direction onto the surface plane to get the tangent
            vec3 tangent = normalize(flowDir - normal * dot(flowDir, normal));

            // --- LIGHTING ---
            vec3 lightPos1 = vec3(2.0 * sin(t), 2.0 * cos(t), 2.0);
            vec3 lightDir1 = normalize(lightPos1 - vec3(p, height));
            vec3 halfVec1 = normalize(lightDir1 + viewDir);

            // 1. Isotropic Diffuse
            float diffuse = max(dot(normal, lightDir1), 0.0);

            // 2. Anisotropic Specular (Silky Sheen)
            // Instead of N dot H, we use the Tangent dot H. 
            // sqrt(1 - (T.H)^2) gives the sine of the angle, stretching the highlight along the fibers.
            float tDotH = dot(tangent, halfVec1);
            float sinTH = sqrt(1.0 - tDotH * tDotH);
            float dirAtten = smoothstep(-1.0, 0.0, dot(tangent, halfVec1)); // Directional bias
            float anisotropicSpec = pow(sinTH, u_sheen) * diffuse;

            // 3. Velvet Rim Light (Fuzz)
            // Strongest where the surface turns away from the camera, but only where lit.
            float nDotV = max(dot(normal, viewDir), 0.0);
            float rim = pow(1.0 - nDotV, 3.0) * diffuse;

            // 4. Subsurface Crevice Glow
            // Invert the height map and isolate the deepest valleys
            float crevice = 1.0-smoothstep(0.0,0.5,height);
            crevice = pow(crevice, 4.0); // Sharpen the glow to deep veins

            // --- COLOR ASSIGNMENT ---
            // Base Iridescence maps height and view angle to color palette
            vec3 baseColor = palette(height * 0.5 - t * 0.1);
            
            // Force aggressive neon contrast
            vec3 pink = vec3(1.0, 0.0, 0.8);
            vec3 cyan = vec3(0.0, 1.0, 1.0);
            baseColor = mix(baseColor, pink, normal.x * 0.5 + 0.5);
            baseColor = mix(baseColor, cyan, normal.y * 0.5 + 0.5);
            baseColor=mix(baseColor,paletteVault(height*0.32+normal.x*0.09-t*0.10),clamp(uPaletteMix,0.0,1.0));

            vec3 glowColor=mix(vec3(1.0,1.0,0.0),paletteVault(0.22),clamp(uPaletteMix,0.0,1.0));

            // --- COMPOSITING ---
            vec3 finalColor = vec3(0.0);
            
            // Core surface
            finalColor += baseColor * diffuse * 0.3;
            // Velvet Rim
            finalColor += baseColor * rim * 2.0;
            // Silky Anisotropic highlight
            finalColor += vec3(1.0) * anisotropicSpec * 1.5;
            // Bioluminescent Glow in crevices
            finalColor += glowColor * crevice * u_glow;

            // Add microscopic noise for the fuzzy texture
            float microFuzz = hash(p * 200.0 + t).x;
            finalColor += (microFuzz - 0.5) * 0.08;

            // Punch up contrast and add vignette
            finalColor = smoothstep(0.0, 1.0, finalColor);
            float vignette = length(uv - 0.5);
            finalColor *= 1.0 - (vignette * vignette * 0.6);

            gl_FragColor = vec4(clamp(finalColor,0.0,1.0),clamp(u_layerOpacity,0.0,1.0));
        }
