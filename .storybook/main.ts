import type { StorybookConfig } from '@storybook/nextjs';
const config: StorybookConfig = {
  stories: ['../components/common/stories'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  staticDirs: [
    {
      from: '../theme/fonts.ts',
      to: 'theme/fonts.ts'
    }
  ],
  webpackFinal: (config) => {
    console.log('override');
    // Add fallbacks for node.js libraries
    let loaders = config.resolve;
    if (loaders) {
      loaders.fallback = {
        fs: false,
        tls: false,
        net: false,
        http: false, //require.resolve('stream-http'),
        https: false,
        os: false,
        zlib: false, //require.resolve('browserify-zlib'),
        path: require.resolve('path-browserify'),
        stream: require.resolve('stream-browserify'),
        util: require.resolve('util/'),
        crypto: false //require.resolve('crypto-browserify')
      };
    }

    return config;
  }
};
export default config;
