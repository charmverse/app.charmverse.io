import * as fs from 'fs';

import * as esbuild from 'esbuild';

esbuild
  .build({
    bundle: true,
    entryPoints: ['./background/initWebsockets.ts', './background/cron.ts'],
    // metafile: true, // uncomment to analyize build file contents
    outdir: './dist',
    packages: 'external',
    platform: 'node',
    sourcemap: true,
    target: 'node18',
    logLevel: 'verbose'
  })
  .catch(() => process.exit(1))
  .then(async (result) => {
    if (result.metafile) {
      // upload output to https://esbuild.github.io/analyze/
      fs.writeFileSync('dist/meta.json', JSON.stringify(result.metafile));
      // review this output to see why a file was included
      const depsTreeOutput = await esbuild.analyzeMetafile(result.metafile, { verbose: true });
      fs.writeFileSync('dist/dependencies.txt', depsTreeOutput);
    }
  });
