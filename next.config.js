/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '.'),
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-DNS-Prefetch-Control', value: 'on' },
      ],
    },
    {
      source: '/api/:path*',
      headers: [
        { key: 'Cache-Control', value: 'no-store, must-revalidate' },
      ],
    },
  ],
  // Disable static generation for API routes
  output: 'standalone',
  // Skip static generation for API routes
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  // Disable static optimization for API routes
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  // Disable static generation for API routes
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
  // Externalize server-only packages that bring in browser assets (e.g., jsdom/cssstyle)
  serverExternalPackages: ['jsdom', 'cssstyle', 'dompurify', 'isomorphic-dompurify'],
}

module.exports = nextConfig