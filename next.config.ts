import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    typedRoutes: true,
  },
  productionBrowserSourceMaps: true,
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
