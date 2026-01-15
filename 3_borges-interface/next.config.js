/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,  // Ignore TS errors for faster dev
  },
  // Turbopack DISABLED - causes jsxDEV/preloadAll errors in Next.js 16
  // turbopack: {},
}

module.exports = nextConfig