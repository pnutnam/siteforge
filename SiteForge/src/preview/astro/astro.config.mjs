import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'static',
  build: {
    assets: '_assets',
    format: 'directory',
  },
  redirects: {},
  server: {
    port: 4321,
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          entryFileNames: '_assets/[name]-[hash].js',
          chunkFileNames: '_assets/[name]-[hash].js',
          assetFileNames: '_assets/[name]-[hash][extname]',
        },
      },
    },
  },
});
