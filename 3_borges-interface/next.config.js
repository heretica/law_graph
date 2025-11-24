/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  // Enable Turbopack (Next.js 16+)
  turbopack: {},
}

module.exports = nextConfig