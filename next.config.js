/**
 * @type {import('next').NextConfig}
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const BundleAnalyzer = require('next-bundle-analyzer');

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
    // turbo: {
    //   resolveAlias: {
    //     fs: false
    //   },
    //   rules: {
    //     '*.svg': {
    //       loaders: ['@svgr/webpack'],
    //       as: '*.js'
    //     }
    //   }
    // }
  },
  images: {
    // next image is broken in staging/production as of 14.0.1
    unoptimized: true
  },
  transpilePackages: esmModules,
  modularizeImports: {
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
      },
      // added 11/2023 to redirect old /bounties route to /rewards
      {
        source: '/:domain/bounties',
        destination: '/:domain/rewards',
        permanent: true // change this to true once we confirm success :)
      }
    ];
  },
  webpack(_config) {
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
