import { fileURLToPath } from 'node:url'

const rootDir = fileURLToPath(new URL('.', import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: rootDir,
  turbopack: {
    root: rootDir,
  },
  images: {
    qualities: [75],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.cuescore.com',
      },
    ],
  },
}

export default nextConfig
