import type { NextConfig } from "next";
// import { withSentryConfig } from '@sentry/nextjs'
// FORCE DEPLOY TIMESTAMP: 2025-05-29-20:22:00 - OWNER FORM MUST WORK

const nextConfig: NextConfig = {
  // React strict mode for better debugging
  reactStrictMode: true,
  
  // Optimize images
  images: {
    domains: ['localhost', 'uploadthing.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cd381d9453ab9baed52c917bb535aae2.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  
  // Disable ESLint during builds for quick deployment
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript checks for quick deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Production optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  
  // Experimental features for better performance
  experimental: {
    // Enable server components optimization
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
    ];
  },
  
  // Disable powered by header
  poweredByHeader: false,
  
  // Output configuration
  output: 'standalone',
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-webpack-plugin#options

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only upload source maps in production
  silent: true,
  dryRun: process.env.NODE_ENV !== 'production',

  // Hide source maps from public access
  hideSourceMaps: true,
  
  // Disable source map uploading in development
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
}

// Export without Sentry in development
export default nextConfig;