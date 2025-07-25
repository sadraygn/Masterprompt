/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep bundle size small for Fly.io
  experimental: {
    optimizeCss: true,
  },
  // Enable standalone output for containerization
  output: 'standalone',
}

module.exports = nextConfig