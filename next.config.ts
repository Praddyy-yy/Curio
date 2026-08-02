import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["groq-sdk", "lucide-react"],
  },
};

export default nextConfig;
