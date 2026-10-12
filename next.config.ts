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
  // Standalone output, required by OpenNext for Cloudflare Workers
  output: 'standalone',
  // Expose server-side env vars
  env: {
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
  },
  // www is not a separate site: send it to the apex, keeping path and query
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.trippified.com' }],
        destination: 'https://trippified.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default withPWA(nextConfig);
