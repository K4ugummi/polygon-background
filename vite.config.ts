import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src', 'index.ts'],
      rollupTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'index.ts'),
      name: 'PolygonBackground',
      fileName: 'polygon-background',
      formats: ['es'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
      },
    },
    // Copy WASM files to dist
    assetsInlineLimit: 0,
  },
  // Properly handle WASM files
  optimizeDeps: {
    exclude: ['polygon-background-wasm'],
  },
  server: {
    open: '/test/index.html',
    // Proper MIME type for WASM
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
});
