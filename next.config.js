/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n: {
    locales: ['en', 'ar'],
    defaultLocale: 'en',
  },
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google profile images
  },
}

module.exports = nextConfig 