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
      // add support for the "css"  prop
      // const jsxRule = config.module.rules.find((rule) => rule?.['test']?.test('.jsx'));
      // if (jsxRule) {
      //   jsxRule.use[0].options.presets.push(require.resolve('@emotion/babel-preset-css-prop'));
      // }

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
    /**
     * Add support for the `node:` scheme available since Node.js 16.
     *
     * `@lit-protocol/lit-node-client` imports from `node:buffer`
     *
     * @see https://github.com/webpack/webpack/issues/13290
     */
    config.plugins = config.plugins ?? [];
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, '');
      })
    );

    return config;
  }
};
export default config;
