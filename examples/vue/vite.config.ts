import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3001,
    fs: {
      allow: [
        // Allow serving from the parent polygon-background package
        resolve(__dirname, '../..'),
      ],
    },
  },
});
