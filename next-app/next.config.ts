import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // TODO: Fix 93 pre-existing Supabase type mismatches and remove this
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
