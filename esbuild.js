/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */

const esbuild = require('esbuild');

esbuild
  .build({
    bundle: true,
    entryPoints: ['./background/initWebsockets.ts', './background/cron.ts'],
    outdir: './dist',
    packages: 'external',
    platform: 'node',
    sourcemap: true,
    target: 'node18'
  })
  .catch(() => process.exit(1));
