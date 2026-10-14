import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Don't fail production builds on ESLint warnings
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Temporary: surface TS errors in logs but allow deploy while we harden types
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
