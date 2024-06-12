/** @type {import('next').NextConfig} */

const CONNECT_API_URL = process.env.CONNECT_API_URL;

const nextConfig = {
  rewrites: async () => {
    return [
      // {
      //   source: '/api/:path*',
      //   destination: `${CONNECT_API_URL}/api/:path*` // Proxy to Backend
      // }
    ];
  }
};

module.exports = nextConfig;
