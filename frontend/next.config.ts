import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Don't fail the production build on ESLint errors
    ignoreDuringBuilds: true,
  },
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
};

export default nextConfig;
