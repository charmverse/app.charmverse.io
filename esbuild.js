/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */

const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

esbuild
  .build({
    entryPoints: ['./background/initWebsockets.ts', './background/cron.ts'],
    outdir: './dist',
    bundle: true,
    format: 'cjs',
    platform: 'node',
    sourcemap: true,
    target: 'node18',
    plugins: [nodeExternalsPlugin()]
  })
  .catch(() => process.exit(1));
