import * as fs from 'fs';

// We use a special config for ceramic which compiles its dependencies to avoid ESM issues

import * as esbuild from 'esbuild';

esbuild
  .build({
    bundle: true,
    entryPoints: ['./src/ceramic-client.ts'],
    // metafile: true, // uncomment to analyize build file contents
    outdir: './dist',
    platform: 'node',
    sourcemap: true,
    target: 'node18'
  })
  .catch(() => process.exit(1))
  .then(async (result) => {
    if (result.metafile) {
      // upload output to https://esbuild.github.io/analyze/
      fs.writeFileSync('dist/meta.json', JSON.stringify(result.metafile));
      // fs.writeFileSync('dist/ceramic/package.json', JSON.stringify({ type: 'module' });
      // review this output to see why a file was included
      const depsTreeOutput = await esbuild.analyzeMetafile(result.metafile, { verbose: true });
      fs.writeFileSync('dist/dependencies.txt', depsTreeOutput);
    }
  });
