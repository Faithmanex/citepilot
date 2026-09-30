import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd(),
  },
  // The AI service is now co-located with the web app as Next.js Route
  // Handlers under /api/v1/* (see src/lib/ai + src/app/api). No external
  // rewrite is required; everything deploys together on Vercel.
  serverExternalPackages: ["unpdf", "mammoth"],
  async redirects() {
    return [
      { source: "/login", destination: "/auth/login", permanent: false },
      { source: "/signup", destination: "/auth/signup", permanent: false },
      { source: "/register", destination: "/auth/signup", permanent: false },
    ];
  },
};

export default nextConfig;
