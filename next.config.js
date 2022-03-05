
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
    // const oneOf = _config.module.rules.find(
    //   (rule) => typeof rule.oneOf === 'object'
    // );

    // if (oneOf) {
    //   const moduleCssRule = oneOf.oneOf.find(
    //     (rule) => regexEqual(rule.test, /\.module\.(scss|sass)$/)
    //     // regexEqual(rule.test, /\.module\.(scss|sass)$/)
    //   );

    //   if (moduleCssRule) {
    //     const cssLoader = moduleCssRule.use.find(({ loader }) => loader.includes('css-loader'));
    //     if (cssLoader) {
    //       cssLoader.options.modules.mode = 'local';
    //     }
    //   }
    // }
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

/** Allow CSS modules in dependencies: https://github.com/vercel/next.js/issues/10142 */
/**
 * Stolen from https://stackoverflow.com/questions/10776600/testing-for-equality-of-regular-expressions
 */
function regexEqual (x, y) {
  return (
    x instanceof RegExp
    && y instanceof RegExp
    && x.source === y.source
    && x.global === y.global
    && x.ignoreCase === y.ignoreCase
    && x.multiline === y.multiline
  );
}

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
  // 'lit-access-control-conditions-modal',
  // 'react-virtualized',
  // 'react-select-virtualized'
]);

module.exports = withBundleAnalyzer(withTM(config));
