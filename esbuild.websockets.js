/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
// Your bundler file
const esbuild = require('esbuild');
const { nodeExternalsPlugin } = require('esbuild-node-externals');

esbuild.build({
  entryPoints: ['./background/websockets.ts'],
  outfile: './dist/websockets.js',
  bundle: true,
  platform: 'node',
  sourcemap: true,
  target: 'node18',
  plugins: [nodeExternalsPlugin()]
});
