import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { WorkoutDataProvider } from "./context/WorkoutDataContext";
import { Analytics } from '@vercel/analytics/next';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plates - The Lifters Database",
  description: "Track your workouts, monitor progress, and achieve your fitness goals",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Plates",
    startupImage: [
      {
        url: "/icons/icon-512x512.png",
        media: "(device-width: 375px) and (device-height: 812px)",
      },
    ],
  },
  applicationName: "Plates",
  keywords: ["workout", "fitness", "exercise", "tracking", "gym", "strength training"],
  authors: [{ name: "Plates" }],
  creator: "Plates",
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Plates",
    title: "Plates - The Lifters Database",
    description: "Track your workouts, monitor progress, and achieve your fitness goals",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "Plates Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Plates - The Lifters Database",
    description: "Track your workouts, monitor progress, and achieve your fitness goals",
    images: ["/icons/icon-512x512.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <WorkoutDataProvider>
            {children}
          </WorkoutDataProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
