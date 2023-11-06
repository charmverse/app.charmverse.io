import * as esbuild from 'esbuild';

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
