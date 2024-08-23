/** @type {import('next').NextConfig} */

// eslint-disable-next-line no-console
console.log('next.config env:', process.env);
const nextConfig = {
  // types are tested separately from the build
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  images: {
    unoptimized: true
  },
  productionBrowserSourceMaps: true,
  // assetPrefix: process.env.REACT_APP_APP_ENV === 'production' ? 'https://cdn.charmverse.io' : undefined,
  assetPrefix:
    process.env.REACT_APP_APP_ENV === 'production' || process.env.REACT_APP_APP_ENV === 'staging'
      ? 'https://cdn.charmverse.io'
      : undefined,
  webpack(_config) {
    // Fix for: "Module not found: Can't resolve 'canvas'"
    // _config.resolve.alias.canvas = false;

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

module.exports = nextConfig;
