import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Wyłącza ESLint podczas budowy
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");
    return config;
  },
};

export default nextConfig;
