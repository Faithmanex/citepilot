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
};

export default nextConfig;
