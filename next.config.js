
const config = {
  poweredByHeader: false,
  webpack5: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/blocks',
        permanent: false,
      },
      {
        source: '/settings',
        destination: '/settings/account',
        permanent: true,
      },
    ]
  },
  webpack(config, { isServer }) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack']
    });
    return config;
  }
}

/**
 * Remove undefined values so Next.js doesn't complain during serialization
 */
const removeUndefined = (obj) => {
  let newObj = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] === Object(obj[key])) newObj[key] = removeUndefined(obj[key]);
    else if (obj[key] !== undefined) newObj[key] = obj[key];
  });
  return newObj;
};
const next = require('next/dist/lib/is-serializable-props');
const isSerializableProps = next.isSerializableProps;
next.isSerializableProps = (page, method, input) => isSerializableProps(page, method, removeUndefined(input));


const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
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
  "@popperjs/core"
]);

module.exports = withBundleAnalyzer(withTM(config));