/** @type {import('next').NextConfig} */

// const CONNECT_API_URL = process.env.CONNECT_API_URL;

const nextConfig = {
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

module.exports = nextConfig;
