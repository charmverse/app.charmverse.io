/**
 * @type {import('next').NextConfig}
 */

/* eslint-disable @typescript-eslint/no-var-requires */
const BundleAnalyzer = require('next-bundle-analyzer');

const esmModules = [
  '@bangle.dev/base-components',
  '@bangle.dev/utils',
  'prosemirror-utils-bangle',
  '@popperjs/core',
  '@fullcalendar/common',
  '@fullcalendar/core',
  '@fullcalendar/daygrid',
  '@fullcalendar/interaction',
  '@fullcalendar/react',
  'dnd-core',
  'react-dnd',
  '@react-dnd/invariant',
  '@react-dnd/asap',
  '@react-dnd/shallowequal',
  'react-pdf',
  'react-dnd-html5-backend',
  'react-dnd-multi-backend',
  'react-dnd-touch-backend',
  'dnd-multi-backend',
  'dnd-core',
  '@react-dnd/invariant',
  '@react-dnd/asap',
  '@react-dnd/shallowequal',
  'react-dnd-preview',
  'redux',
  '@hookform/resolvers',
  // 'uuid',
  'data-uri-to-buffer',
  'fetch-blob',
  'lodash-es',
  // '@babel/runtime',
  'formdata-polyfill',
  'jose',
  'nanoid',
  '@lens-protocol',
  'wagmi' // compile wagmi to avoid error: QueryClientProvider must be used as a child of ReactQueryClientProvider when running app
];

// this breaks the dev environment with an error when importing MUI icons: Cannot use 'import.meta' outside a module
if (process.env.NODE_ENV === 'test') {
  esmModules.push('@babel/runtime');
  esmModules.push('isows');
  // related modules
  esmModules.push(
    ...[
      'wagmi',
      '@wagmi/core',
      '@wagmi/connectors',
      '@walletconnect/core',
      '@walletconnect/utils',
      '@walletconnect/ethereum-provider',
      '@walletconnect/relay-auth',
      'preact',
      'uint8arrays',
      'multiformats'
    ]
  );
}

// Next.js requires this configured at build and run time
const useCDN =
  process.env.CI || process.env.REACT_APP_APP_ENV === 'production' || process.env.REACT_APP_APP_ENV === 'staging';

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
  assetPrefix: useCDN ? 'https://cdn.charmverse.io' : undefined,
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
