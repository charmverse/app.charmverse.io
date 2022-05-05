const path = require('path');

const config = {
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
      },
      {
        source: '/profile',
        destination: '/profile/tasks',
        permanent: false
      }
    ];
  },
  webpack (_config, { nextRuntime }) {
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
            deleteArchived: './background/deleteArchived.ts'
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

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

// fix for esm modules
const withTM = require('next-transpile-modules')([
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
  'react-dnd'
]);

module.exports = withBundleAnalyzer(withTM(config));
