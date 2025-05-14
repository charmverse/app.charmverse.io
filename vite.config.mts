import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // passing 'test' in here results in .env.test.local being loaded
    env: loadEnv('test', process.cwd(), ''),
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
          name: 'webapp-browser',
          include: ['apps/webapp/components/**/*.spec.{ts,tsx}', 'apps/webapp/hooks/**/*.spec.{ts,tsx}'],
          environment: 'jsdom'
        }
      },
      {
        extends: true,
        test: {
          name: 'webapp-lib',
          include: ['apps/webapp/lib/**/*.spec.{ts,tsx}'],
          globalSetup: './vite.globalSetup.ts'
        }
      },
      {
        // add "extends: true" to inherit the options from the root config
        extends: true,
        test: {
          name: 'cron',
          include: ['apps/cron/src/**/*.spec.ts'],
          globalSetup: './vite.globalSetup.ts'
        }
      },
      {
        // add "extends: true" to inherit the options from the root config
        extends: true,
        test: {
          name: 'websockets',
          include: ['apps/websockets/src/**/*.spec.ts'],
          globalSetup: './vite.globalSetup.ts'
        }
      },
      {
        // add "extends: true" to inherit the options from the root config
        extends: true,
        test: {
          name: 'packages',
          include: ['packages/**/src/**/*.spec.ts'],
          globalSetup: './vite.globalSetup.ts'
        }
      }
    ]
  }
});
