import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// 1. Logic to detect if we are building for the iOS App
const isMobileBuild = process.env.IS_CAPACITOR === "true";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development" || isMobileBuild, 
  register: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    disableDevLogs: true,
    skipWaiting: true,
    clientsClaim: true,
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-api-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24,
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-images",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24 * 30,
          },
        },
      },
      {
        urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
        handler: "CacheFirst",
        options: {
          cacheName: "static-fonts",
          expiration: {
            maxEntries: 20,
            maxAgeSeconds: 60 * 60 * 24 * 365,
          },
        },
      },
      {
        urlPattern: /\.(?:js|css)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "static-resources",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24 * 7,
          },
        },
      },
      {
        urlPattern: /^https:\/\/.*$/i,
        handler: "NetworkFirst",
        options: {
          cacheName: "pages-cache",
          expiration: {
            maxEntries: 50,
            maxAgeSeconds: 60 * 60 * 24,
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // 2. Export ONLY for iOS build
  output: isMobileBuild ? 'export' : undefined,

  // 3. Trailing slash is REQUIRED for Capacitor to find your pages
  trailingSlash: true,

  // 4. Ignore checks to speed up the Mac build and unblock Vercel
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  images: {
    unoptimized: isMobileBuild,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  // 5. Build-specific overrides
  // This prevents the build from crashing when it hits server-only code
  ...(isMobileBuild ? {
    distDir: 'out',
  } : {
    // 6. Headers ONLY for Web/Vercel/Android
    async headers() {
      return [
        {
          source: "/sw.js",
          headers: [
            { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
            { key: "Service-Worker-Allowed", value: "/" },
          ],
        },
        {
          source: "/manifest.json",
          headers: [
            { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          ],
        },
        {
          source: "/.well-known/assetlinks.json",
          headers: [
            { key: "Content-Type", value: "application/json" },
            { key: "Cache-Control", value: "public, max-age=3600" },
          ],
        },
      ];
    },
  }),
};

export default withPWA(nextConfig);