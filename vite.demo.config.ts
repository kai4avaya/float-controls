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
      // Don't externalize lit - bundle it instead
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
