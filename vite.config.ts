import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
  const baseConfig = {
    resolve: {
      alias: {
        '@': resolve(__dirname, './src')
      }
    },
    // Vitest configuration (ignored by Vite)
    test: {
      environment: 'happy-dom',
      globals: true,
    },
  };

  // In dev mode, configure for HTML serving
  if (command === 'serve') {
    return {
      ...baseConfig,
      root: '.',
      server: {
        open: '/demo.html',
        fs: {
          allow: ['.']
        }
      },
      // Serve dist files as static assets
      appType: 'mpa' // Multi-page app mode
    };
  }

  // In build mode, use library configuration
  return {
    ...baseConfig,
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'MyControlPanel',
        fileName: 'my-control-panel',
        formats: ['es']
      },
      rollupOptions: {},
      outDir: 'dist',
      sourcemap: true
    }
  };
});
