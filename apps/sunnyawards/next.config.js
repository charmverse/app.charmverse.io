/** @type {import('next').NextConfig} */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('node:path');

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
  webpack(_config) {
    const imgDir = path.join(__dirname, '..', '..', 'public');
    console.log('Img dir', imgDir);
    // Fix for: "Module not found: Can't resolve 'canvas'"
    // _config.resolve.alias.canvas = false;
    _config.resolve.alias['@images'] = imgDir;

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
