import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    setupFiles: ['./vite.setup.ts'],
    server: {
      deps: {
        inline: ['@charmverse/core']
      }
    },
    workspace: [
      {
        // add "extends: true" to inherit the options from the root config
        extends: true,
        test: {
          name: 'browser',
          include: ['components/**/*.spec.{ts,tsx}', 'hooks/**/*.spec.{ts,tsx}'],
          environment: 'jsdom'
        }
      },
      {
        extends: true,
        test: {
          name: 'lib',
          include: ['lib/**/*.spec.{ts,tsx}'],
          globalSetup: '../vite.globalSetup.ts'
        }
      }
    ]
  }
});
