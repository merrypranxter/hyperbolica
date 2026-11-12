precision highp float;

        varying float vGlyphType;
        varying float vColorSeed;
        varying float vAlpha;

        uniform sampler2D u_palette;
        uniform float uPalettePhase;
        uniform float uAcid;

        #define PI  3.14159265359
        #define TAU 6.28318530718

        float safeAtan(float y, float x) {
            float safeX = (abs(x) + abs(y) < 1e-6) ? 1e-6 : x;
            return atan(y, safeX);
        }

        vec3 swarmNeonColor(float p) {
            return texture2D(u_palette,vec2(fract(p+uPalettePhase),0.5)).rgb;
        }

        void main() {
            if (vAlpha <= 0.01) discard;

            vec2 p = gl_PointCoord * 2.0 - 1.0;
            float r = length(p);
            if (r > 1.0) discard;

            float a = safeAtan(p.y, p.x);
            float mask = 0.0;

            if (vGlyphType < 0.5) {
                // Glyph 0: 6-Pointed Diatom Silica Star
                float rays = abs(cos(a * 3.0));
                mask = (1.0-smoothstep(rays-0.25,rays,r));
            } else if (vGlyphType < 1.5) {
                // Glyph 1: Concentric Moiré Target Ring
                float ring = abs(r - 0.62);
                float core = (1.0-smoothstep(0.05,0.28,r));
                mask = max((1.0-smoothstep(0.02,0.18,ring)), core);
            } else if (vGlyphType < 2.5) {
                // Glyph 2: Crisp Stipple Dot
                mask = (1.0-smoothstep(0.20,0.85,r));
            } else {
                // Glyph 3: Cyber Diamond Reticle
                float d = abs(p.x) + abs(p.y);
                mask = (1.0-smoothstep(0.02,0.20,abs(d-0.65))) + (1.0-smoothstep(0.05,0.22,r));
            }

            // Dark obsidian halo around each sprite so particles never wash out to white!
            float innerNeon = clamp(mask, 0.0, 1.0);
            float outerRim  = (1.0-smoothstep(0.55,1.0,r));
            if (outerRim < 0.05) discard;

            vec3 neonCol = swarmNeonColor(vColorSeed);
            // Multiply by innerNeon so the outer rim of the sprite is dark obsidian ink (#04010a)
            vec3 finalRGB = mix(vec3(0.02, 0.005, 0.04), neonCol, innerNeon);

            gl_FragColor = vec4(finalRGB, outerRim * vAlpha * 0.85);
        }
