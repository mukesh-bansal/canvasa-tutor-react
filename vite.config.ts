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
        // v0.1.4: katex is an OPTIONAL peer dep. Host (Olympiz / SuperStem)
        // already installs it; we externalize so we don't bundle a duplicate.
        // If the host doesn't have katex, our useKatexRender hook silently
        // no-ops and statements render as raw text.
        /^katex(\/.*)?$/,
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
