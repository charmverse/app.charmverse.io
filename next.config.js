
const PluginTransformImport = require('swc-plugin-transform-import').default;

const config = {
  poweredByHeader: false,
  webpack5: true,
  async redirects () {
    return [
      {
        source: '/:domain/settings',
        destination: '/:domain/settings/account',
        permanent: true
      }
    ];
  },
  webpack (_config, { isServer }) {
    _config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });
    const swcRule = _config.module.rules.find(rule => rule.use?.loader === 'next-swc-loader');
    swcRule.use.options.plugin = (m) => new PluginTransformImport({
      '@mui/material': {
        // eslint-disable-next-line no-template-curly-in-string
        transform: '@mui/material/${member}',
        preventFullImport: true
      },
      '@mui/icons-material': {
        // eslint-disable-next-line no-template-curly-in-string
        transform: '@mui/icons-material/${member}',
        preventFullImport: true
      },
      '@mui/lab': {
        // eslint-disable-next-line no-template-curly-in-string
        transform: '@mui/lab/${member}',
        preventFullImport: true
      }
    }).visitProgram(m);
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
  '@bangle.dev/emoji',
  '@bangle.dev/react-emoji-suggest',
  '@bangle.dev/table',
  '@popperjs/core',
  '@fullcalendar/common',
  '@fullcalendar/core',
  '@fullcalendar/daygrid',
  '@fullcalendar/interaction',
  '@fullcalendar/react'
]);

module.exports = withBundleAnalyzer(withTM(config));
