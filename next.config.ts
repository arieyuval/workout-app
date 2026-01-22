import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

// 1. Logic to detect if we are building for the iOS App
// Use this variable when running: IS_CAPACITOR=true npm run build
const isMobileBuild = process.env.IS_CAPACITOR === "true";

const withPWA = withPWAInit({
  dest: "public",
  // Disable PWA for mobile native builds to prevent Service Worker conflicts on iOS
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
        urlPattern: /^https:\/\/.\.supabase\.co\/rest\/v1\/./i,
        handler: "NetworkFirst",
        options: {
          cacheName: "supabase-api-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
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
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
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
            maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
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
            maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
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
            maxAgeSeconds: 60 * 60 * 24, // 24 hours
          },
          networkTimeoutSeconds: 10,
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  // 2. Switch to 'export' ONLY for the iOS build
  output: isMobileBuild ? 'export' : undefined,

  // 3. Trailing slashes are often required for correct routing in Capacitor apps
  trailingSlash: isMobileBuild ? true : false,

  // 4. Ignore errors during build to prevent Vercel and Mac hangs
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // 5. Disable image optimization ONLY for the iOS build (Capacitor doesn't support the Next.js Image Server)
  images: {
    unoptimized: isMobileBuild,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  // 6. Spread headers ONLY if it's NOT a mobile build
  // This prevents the "Headers cannot be used with output: export" error
  ...( !isMobileBuild && {
    async headers() {
      return [
        {
          source: "/sw.js",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=0, must-revalidate",
            },
            {
              key: "Service-Worker-Allowed",
              value: "/",
            },
          ],
        },
        {
          source: "/manifest.json",
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=0, must-revalidate",
            },
          ],
        },
        {
          source: "/.well-known/assetlinks.json",
          headers: [
            {
              key: "Content-Type",
              value: "application/json",
            },
            {
              key: "Cache-Control",
              value: "public, max-age=3600",
            },
          ],
        },
      ];
    },
  }),
};

export default withPWA(nextConfig);