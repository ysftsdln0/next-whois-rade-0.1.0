/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['whois-json'],
  },
  server: {
    port: 3002,
  },
}

module.exports = nextConfig
