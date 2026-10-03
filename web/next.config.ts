import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  output: "export",
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  agentRules: false,
  outputFileTracingRoot: path.resolve(process.cwd(), ".."),
  webpack(config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
};
export default config;
