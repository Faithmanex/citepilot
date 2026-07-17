import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ?? "https://citepilot-gateway.up.railway.app/api/v1",
  },
};

export default nextConfig;
