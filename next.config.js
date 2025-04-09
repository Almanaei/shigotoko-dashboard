/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Custom handler for the mockServiceWorker.js request to prevent 404s
  async rewrites() {
    return [
      {
        source: '/mockServiceWorker.js',
        destination: '/api/empty-response',
      },
    ];
  },
};

module.exports = nextConfig; 