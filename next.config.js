/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.cuescore.com',
      },
    ],
  },
}

module.exports = nextConfig
