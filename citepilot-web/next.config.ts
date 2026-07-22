import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    const apiTarget =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      "https://citepilot-ai-production.up.railway.app/api/v1";

    const cleanTarget = apiTarget.replace(/\/$/, "");
    const destination = cleanTarget.endsWith("/api/v1")
      ? `${cleanTarget}/:path*`
      : `${cleanTarget}/api/v1/:path*`;

    return [
      {
        source: "/api/v1/:path*",
        destination,
      },
    ];
  },
};

export default nextConfig;

