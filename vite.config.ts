import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command, mode }) => {
  // In dev mode, configure for HTML serving
  if (command === 'serve') {
    return {
      root: '.',
      server: {
        open: '/demo.html',
        fs: {
          allow: ['.']
        }
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, './src')
        }
      },
      // Don't optimize the bundled file
      optimizeDeps: {
        exclude: ['lit']
      },
      // Serve dist files as static assets
      appType: 'mpa' // Multi-page app mode
    };
  }

  // In build mode, use library configuration
  return {
    build: {
      lib: {
        entry: resolve(__dirname, 'src/index.ts'),
        name: 'MyControlPanel',
        fileName: 'my-control-panel',
        formats: ['es']
      },
      rollupOptions: {
        external: ['lit'],
        output: {
          globals: {
            lit: 'lit'
          }
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
  };
});
