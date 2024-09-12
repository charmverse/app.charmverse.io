import * as fs from 'fs';

import * as esbuild from 'esbuild';

esbuild
  .build({
    bundle: true,
    entryPoints: ['./src/cron.ts'],
    // metafile: true, // uncomment to analyize build file contents
    outdir: './dist',
    tsconfig: './tsconfig.json',
    packages: 'external',
    platform: 'node',
    sourcemap: true
    // target: 'node18'
    // logLevel: 'verbose' // uncomment to see more build details like imported file info
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
