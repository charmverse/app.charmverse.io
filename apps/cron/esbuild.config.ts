import * as fs from 'fs';

import ddPlugin from 'dd-trace/esbuild';
import * as esbuild from 'esbuild';

esbuild
  .build({
    bundle: true,
    entryPoints: ['./src/cron.ts'],
    // metafile: true, // uncomment to analyize build file contents
    outdir: './dist',
    tsconfig: './tsconfig.json',
    // packages: 'external',
    external: ['@charmverse/core'],
    plugins: [ddPlugin],
    platform: 'node',
    sourcemap: true,
    // this makes it so that we can use require in the built file https://github.com/evanw/esbuild/issues/946
    banner: {
      js: "import { createRequire as topLevelCreateRequire } from 'module';\n const require = topLevelCreateRequire(import.meta.url);\n import path from 'path';\n import { fileURLToPath } from 'url';\n const __filename = fileURLToPath(import.meta.url);\n const __dirname = path.dirname(__filename);"
    }
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
