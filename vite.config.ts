import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'CanvasaTutorReact',
      fileName: 'tutor-react',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'react-router-dom',
        '@tanstack/react-query',
        'axios',
      ],
      output: {
        assetFileNames: (asset) => {
          if (asset.name === 'style.css') return 'styles.css';
          return asset.name || 'assets/[name][extname]';
        },
      },
    },
    sourcemap: true,
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
});
