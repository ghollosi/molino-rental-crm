import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  trailingSlash: false,
  generateBuildId: () => 'build-' + Date.now(),
  poweredByHeader: false,
};

export default nextConfig;
