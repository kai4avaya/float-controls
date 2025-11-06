import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'MyControlPanel',
      fileName: 'my-control-panel-bundled',
      formats: ['es']
    },
    rollupOptions: {
      // Bundle all dependencies (no external dependencies)
      external: [],
      output: {
        globals: {}
      }
    },
    outDir: 'dist',
    sourcemap: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
});
