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
  },
  server: {
    open: '/test/index.html',
  },
});
