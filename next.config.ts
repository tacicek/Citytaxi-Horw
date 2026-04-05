import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Docker / self-host: after `next build`, run `npm run start:standalone` from project root
  // (or copy `standalone`, `.next/static`, and `public` per Next docs). Using `next start` with
  // standalone output can break if `.next` is incomplete—run `npm run build:fresh` if you see
  // missing chunk errors (e.g. Cannot find module './611.js').
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },
}

export default nextConfig
