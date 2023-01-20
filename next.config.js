/* eslint-disable @typescript-eslint/no-var-requires */

const BundleAnalyzer = require('@next/bundle-analyzer');
const next = require('next/dist/lib/is-serializable-props');
const webpack = require('webpack');

const esmModules = require('./next.base').esmModules;

const config = {
  poweredByHeader: false,
  eslint: {
    // add background to the default list of pages for eslint
    dirs: ['pages', 'components', 'lib', 'background']
  },
  compiler: {
    styledComponents: true
  },
  experimental: {
    esmExternals: false
  },
  transpilePackages: esmModules,
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
  },
  async redirects() {
    return [
      {
        source: '/:domain(^(?!.*\bapi\b).*$)/settings',
        destination: '/:domain/settings/workspace',
        permanent: false
      },
      {
        source: '/:domain(^(?!.*\bapi\b).*$)/bounties/:id',
        destination: '/:domain/bounties?bountyId=:id',
        permanent: false
      },
      {
        // strip out old /share prefix
        source: '/share/:path*',
        destination: '/:path*',
        permanent: true
      }
    ];
  },
  webpack(_config, { buildId, nextRuntime }) {
    // Fix for: "Module not found: Can't resolve 'canvas'"
    _config.resolve.alias.canvas = false;
    _config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: {
            svgoConfig: {
              // dont remove viewBox which allows svg to scale properly
              plugins: [
                {
                  name: 'preset-default',
                  params: {
                    overrides: { removeViewBox: false }
                  }
                }
              ]
            }
          }
        }
      ]
    });
    // check for nodejs runtime. see https://github.com/vercel/next.js/issues/36237#issuecomment-1117694528
    if (nextRuntime === 'nodejs') {
      const entry = _config.entry;
      _config.entry = () => {
        return entry().then((_entry) => {
          return {
            ..._entry,
            cron: './background/cron.ts',
            websockets: './background/websockets.ts'
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
const removeUndefined = (obj) => {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] === Object(obj[key])) newObj[key] = removeUndefined(obj[key]);
    else if (obj[key] !== undefined) newObj[key] = obj[key];
  });
  return newObj;
};

// eslint-disable-next-line prefer-destructuring
const isSerializableProps = next.isSerializableProps;
next.isSerializableProps = function _isSerializableProps(page, method, input) {
  return isSerializableProps(page, method, removeUndefined(input));
};

const withBundleAnalyzer = BundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
});
module.exports = withBundleAnalyzer(config);
