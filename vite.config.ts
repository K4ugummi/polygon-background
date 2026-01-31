import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import dts from 'vite-plugin-dts';

// Custom plugin to replace base64 data URLs with Uint8Array literals
// This avoids issues with // in base64 being treated as comments by Angular's dev server
function wasmUint8ArrayPlugin() {
  return {
    name: 'wasm-uint8array',
    closeBundle() {
      // Read the WASM file
      const wasmPath = resolve(__dirname, 'src/wasm-pkg/polygon_background_wasm_bg.wasm');
      const wasmBytes = readFileSync(wasmPath);

      // Convert to comma-separated byte values for Uint8Array literal
      const byteArray = Array.from(wasmBytes).join(',');

      // Find and modify the wasm chunk file
      const outDir = 'dist';
      const files = readdirSync(outDir);

      for (const file of files) {
        if (file.includes('polygon_background_wasm') && file.endsWith('.js')) {
          const filePath = join(outDir, file);
          let content = readFileSync(filePath, 'utf-8');

          // Replace the full new URL("data:...", import.meta.url) expression with __wasmBytes
          // This pattern matches: new URL("data:application/wasm;base64,...", import.meta.url)
          const dataUrlPattern = /new URL\("data:application\/wasm;base64,[A-Za-z0-9+\/=]+",\s*import\.meta\.url\)/g;

          if (dataUrlPattern.test(content)) {
            // Reset regex lastIndex after test
            dataUrlPattern.lastIndex = 0;

            content = content.replace(dataUrlPattern, '__wasmBytes');

            // Add the WASM bytes as a Uint8Array at the top of the file
            const wasmBytesVar = `var __wasmBytes=new Uint8Array([${byteArray}]);`;
            content = wasmBytesVar + content;

            writeFileSync(filePath, content);
            console.log(`Replaced base64 data URL with Uint8Array in ${file}`);
          }
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [
    dts({
      include: ['src', 'index.ts'],
      rollupTypes: true,
    }),
    wasmUint8ArrayPlugin(),
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
