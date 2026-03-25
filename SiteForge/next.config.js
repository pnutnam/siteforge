/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['your-cdn-domain.com', 's3.amazonaws.com'],
  },
  experimental: {
    serverActions: true,
  },
}

module.exports = nextConfig
