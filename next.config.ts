import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // DEBT-001 FIX: Removed ignoreBuildErrors — TypeScript errors should be caught at build time
  typescript: {
    ignoreBuildErrors: false,
  },
  // DEBT-002 FIX: Enabled strict mode for better React development practices
  reactStrictMode: true,
};

export default nextConfig;
