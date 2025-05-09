import type { StorybookConfig } from '@storybook/nextjs';
import webpack from 'webpack';

const config: StorybookConfig = {
  stories: ['../stories'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: {
    name: '@storybook/nextjs',
    options: {}
  },
  docs: {
    autodocs: 'tag'
  },
  /*
   * The `config` argument contains all the other existing environment variables.
   * Either configured in an `.env` file or configured on the command line.
   */
  env: (config) => ({
    ...config,
    DOMAIN: 'http://localhost:6006',
    IS_STORYBOOK: 'true'
  }),
  staticDirs: [
    '../public',
    {
      from: '../theme/fonts.ts',
      to: 'theme/fonts.ts'
    }
  ],
  webpackFinal: (config) => {
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

    // This modifies the existing image rule to exclude .svg files
    // since you want to handle those files with @svgr/webpack
    if (config.module?.rules) {
      const imageRule = config.module.rules.find((rule) => rule?.['test']?.test('.svg'));
      if (imageRule) {
        imageRule['exclude'] = /\.svg$/;
      }

      // Configure .svg files to be loaded with @svgr/webpack
      config.module.rules.push({
        test: /\.svg$/,
        use: ['@svgr/webpack']
      });
    }

    return config;
  },
  core: {
    disableTelemetry: true // Disables telemetry
  }
};
export default config;
