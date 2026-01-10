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
  // Required for OpenNext/Cloudflare deployment
  output: 'standalone',
};

export default withPWA(nextConfig);
