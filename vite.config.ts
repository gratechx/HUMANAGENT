import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-extension-files',
      closeBundle() {
        // Copy manifest.json
        copyFileSync('manifest.json', 'dist/manifest.json');
        
        // Copy locales
        if (!existsSync('dist/_locales/ar')) {
          mkdirSync('dist/_locales/ar', { recursive: true });
        }
        if (!existsSync('dist/_locales/en')) {
          mkdirSync('dist/_locales/en', { recursive: true });
        }
        copyFileSync('_locales/ar/messages.json', 'dist/_locales/ar/messages.json');
        copyFileSync('_locales/en/messages.json', 'dist/_locales/en/messages.json');
        
        // Copy icons if they exist
        if (existsSync('icons')) {
          if (!existsSync('dist/icons')) {
            mkdirSync('dist/icons', { recursive: true });
          }
        }
      }
    }
  ],
  
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        sidepanel: resolve(__dirname, 'src/sidepanel/index.html'),
        options: resolve(__dirname, 'src/options/index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return '[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
});
