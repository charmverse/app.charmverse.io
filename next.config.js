/* eslint-disable @typescript-eslint/no-var-requires */

const webpack = require('webpack');
const BundleAnalyzer = require('@next/bundle-analyzer');
const transpileModules = require('next-transpile-modules');

const esmModules = [
  '@bangle.dev/base-components',
  '@bangle.dev/core',
  '@bangle.dev/pm',
  '@bangle.dev/react',
  '@bangle.dev/utils',
  '@bangle.dev/markdown',
  '@bangle.dev/tooltip',
  '@bangle.dev/react-menu',
  '@bangle.dev/table',
  '@popperjs/core',
  '@fullcalendar/common',
  '@fullcalendar/core',
  '@fullcalendar/daygrid',
  '@fullcalendar/interaction',
  '@fullcalendar/react',
  'react-dnd',
  '@hookform/resolvers',
  'lit-share-modal-v3-react-17',
  'uuid'
];

const config = {
  generateEtags: false,
  poweredByHeader: false,
  webpack5: true,
  experimental: {
    esmExternals: 'loose',
    modularizeImports: {
      '@mui/material': {
        transform: '@mui/material/{{member}}'
      },
      '@mui/icons-material': {
        transform: '@mui/icons-material/{{member}}'
      },
      lodash: {
        transform: 'lodash/{{member}}'
      }
    }
  },
  async redirects () {
    return [
      {
        source: '/:domain/settings',
        destination: '/:domain/settings/workspace',
        permanent: false
      }
    ];
  },
  webpack (_config, { buildId, nextRuntime }) {
    _config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });
    // check for nodejs runtime. see https://github.com/vercel/next.js/issues/36237#issuecomment-1117694528
    if (nextRuntime === 'nodejs') {
      const entry = _config.entry;
      _config.entry = () => {
        return entry().then(_entry => {
          return {
            ..._entry,
            cron: './background/cron.ts'
          };
        });
      };
    }
    _config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NEXT_PUBLIC_BUILD_ID': `"${buildId}"`
      })
    );
    return _config;
  }
};

/**
 * Remove undefined values so Next.js doesn't complain during serialization
 */
const removeUndefined = obj => {
  const newObj = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] === Object(obj[key])) newObj[key] = removeUndefined(obj[key]);
    else if (obj[key] !== undefined) newObj[key] = obj[key];
  });
  return newObj;
};

const next = require('next/dist/lib/is-serializable-props');
// eslint-disable-next-line prefer-destructuring
const isSerializableProps = next.isSerializableProps;
next.isSerializableProps = function _isSerializableProps (page, method, input) {
  return isSerializableProps(page, method, removeUndefined(input));
};

const withBundleAnalyzer = BundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
});

// fix for esm modules
const withTM = transpileModules(esmModules);

module.exports = withBundleAnalyzer(withTM(config));

module.exports.esmModules = esmModules;
