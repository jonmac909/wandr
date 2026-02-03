import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  // Enable Turbopack explicitly (Next.js 16 default)
  turbopack: {},
  // Standalone output for Vercel deployment
  output: 'standalone',
  // Expose server-side env vars
  env: {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
};

export default withPWA(nextConfig);
