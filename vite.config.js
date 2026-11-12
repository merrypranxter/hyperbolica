import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  base: './',
  build: { target: 'es2020', outDir: 'dist', rollupOptions: { input: {
    main: fileURLToPath(new URL('./index.html', import.meta.url)),
    spinodal: fileURLToPath(new URL('./experiments/spinodal-reliquary/index.html', import.meta.url))
  } } }
});
