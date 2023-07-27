/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs');
const path = require('node:path');

const BundleAnalyzer = require('@next/bundle-analyzer');
const next = require('next/dist/lib/is-serializable-props');
const webpack = require('webpack');

const esmModules = require('./next.base').esmModules;
const uuid = require('uuid');

// we can save time and skip code checks, which are handle in a special step by the CI
const skipCodeChecks = process.env.CI === 'true';

const config = {
  poweredByHeader: false,
  eslint: {
    // add background and serverless to the default list of pages for eslint
    dirs: ['pages', 'components', 'lib', 'background', 'serverless'],
    ignoreDuringBuilds: skipCodeChecks
  },
  // types are tested separately from the build
  typescript: {
    ignoreBuildErrors: skipCodeChecks,
    tsconfigPath: 'tsconfig.next.json'
  },
  compiler: {
    styledComponents: true
  },
  experimental: {
    esmExternals: false
    //    externalDir: true
  },
  transpilePackages: esmModules,
  modularizeImports: {
    '@mui/material': {
      transform: '@mui/material/{{member}}'
    },
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}'
    },
    '@mui/system': {
      transform: '@mui/system/{{member}}'
    },
    lodash: {
      transform: 'lodash/{{member}}'
    }
  },
  async generateBuildId() {
    return process.env.NEXT_PUBLIC_BUILD_ID || uuid.v4();
  },
  async redirects() {
    return [
      {
        source: '/:domain(^(?!.*\bapi\b).*$)/settings/:path*',
        destination: '/:domain',
        permanent: true
      },
      {
        source: '/:domain(^(?!.*\bapi\b).*$)/settings',
        destination: '/:domain',
        permanent: true
      },
      {
        source: '/nexus',
        destination: '/',
        permanent: true
      },
      {
        source: '/profile',
        destination: '/',
        permanent: true
      },
      {
        source: '/integrations',
        destination: '/',
        permanent: true
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
      },
      // added 4/2023 to redirect old /createWorkspace to /createSpace
      {
        source: '/createWorkspace',
        destination: '/createSpace',
        permanent: true
      },
      // added 4/2023 to redirect /signup to /createSpace
      {
        source: '/signup',
        destination: '/createSpace',
        permanent: true
      }
    ];
  },
  webpack(_config, { buildId, nextRuntime }) {
    // Fix for: "Module not found: Can't resolve 'canvas'"
    _config.resolve.alias.canvas = false;

    // Fix for: "Module not found: Can't resolve X" when using moduleResolution, nodeNext
    // https://github.com/vercel/next.js/discussions/41189#discussioncomment-4488386
    // _config.resolve.extensionAlias = {
    //   '.js': ['.js', '.ts'],
    //   '.jsx': ['.jsx', '.tsx']
    // };

    // const externalDir = path.resolve(__dirname, '..', 'core', 'node_modules');

    // _config.resolve.modules.push(externalDir);

    // // _config.module.rules.push({ include: [path.resolve(__dirname), path.resolve(__dirname, '../core/node_modules')] });

    // _config.resolve.alias['@prisma/client'] = path.resolve(__dirname, '../core/node_modules/@prisma/client');

    // _config.resolve.symlinks = true;

    //   console.log('ALIAS', _config.resolve.alias);

    //    console.log('Module', _config.module);

    // _config.resolve.modules = [
    //   ...(_config.resolve.modules ?? []),
    //   path.resolve(__dirname, 'node_modules'),
    //   path.resolve(__dirname, '../charmverse-common/node_modules')
    // ];

    // //    _config.resolve.symlinks = false;

    // const aliasUrl = fs.realpathSync(
    //   path.resolve(path.join(__dirname, '../charmverse-common/node_modules/@prisma/client'))
    // );

    // console.log(`Alias URL:`, aliasUrl);

    // _config.resolve.alias['@prisma/client'] = aliasUrl;
    // );
    // _config.resolve.modules['@prisma/client'] = path.resolve(
    //   'node_modules/@charmverse/core/node_modules/@prisma/client'
    // );

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
            websockets: './background/initWebsockets.ts',
            countSpaceData: './scripts/countSpaceData.ts',
            importFromDiscourse: './scripts/importFromDiscourse.ts'
          };
        });
      };
    }

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
