/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here if needed
  },
}

module.exports = nextConfig 