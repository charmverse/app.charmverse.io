/* eslint-disable @typescript-eslint/no-var-requires */
const BundleAnalyzer = require('@next/bundle-analyzer');

const esmModules = require('./next.base').esmModules;

const config = {
  poweredByHeader: false,
  eslint: {
    // add background and serverless to the default list of pages for eslint
    dirs: ['pages', 'components', 'lib', 'background', 'serverless', 'stories'],
    ignoreDuringBuilds: true
  },
  // types are tested separately from the build
  typescript: {
    ignoreBuildErrors: true,
    tsconfigPath: 'tsconfig.next.json'
  },
  compiler: {
    styledComponents: true
  },
  experimental: {
    esmExternals: false,
    webpackBuildWorker: true
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
  assetPrefix: process.env.REACT_APP_APP_ENV === 'production' ? 'https://cdn.charmverse.io' : undefined,
  productionBrowserSourceMaps: true,
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
      // {
      //   source: '/:domain/bounties',
      //   destination: '/:domain/rewards',
      //   permanent: true
      // },
      // {
      //   source: '/:domain(^(?!.*\bapi\b).*$)/bounties/:id',
      //   destination: '/:domain/bounties?bountyId=:id',
      //   permanent: false
      // },
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
        source: '/u/:path*',
        destination: '/',
        permanent: true
      },
      {
        source: '/integrations',
        destination: '/',
        permanent: true
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
  webpack(_config, { buildId, nextRuntime, webpack }) {
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
            websockets: './background/initWebsockets.ts'
            // countSpaceData: './scripts/countSpaceData.ts',
            // importFromDiscourse: './scripts/importFromDiscourse.ts',
          };
        });
      };
    } else {
      /**
       * Add support for the `node:` scheme available since Node.js 16.
       *
       * `@lit-protocol/lit-node-client` imports from `node:buffer`
       *
       * @see https://github.com/webpack/webpack/issues/13290
       */
      _config.plugins = _config.plugins ?? [];
      _config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
          resource.request = resource.request.replace(/^node:/, '');
        })
      );
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

const withBundleAnalyzer = BundleAnalyzer({
  enabled: process.env.ANALYZE === 'true'
});
module.exports = withBundleAnalyzer(config);
