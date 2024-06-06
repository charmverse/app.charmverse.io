/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: async () => {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BUILDER_API_URL}/api/:path*` // Proxy to Backend
      }
    ];
  }
};

export default nextConfig;
