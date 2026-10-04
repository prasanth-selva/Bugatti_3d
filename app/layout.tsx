import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geist = localFont({
  src: "../node_modules/geist/dist/fonts/geist-sans/Geist-Variable.woff2",
  display: "swap",
  variable: "--font-geist",
  weight: "100 900",
});
const geistMono = localFont({
  src: "../node_modules/geist/dist/fonts/geist-mono/GeistMono-Variable.woff2",
  display: "swap",
  variable: "--font-geist-mono",
  weight: "100 900",
});
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL("https://prasanth-selva.github.io"),
  title: "BUGATTI CHIRON — Anatomy of Speed",
  description: "Explore the anatomy of the Bugatti Chiron: 1,500 horsepower, engineered to the last detail. An immersive study in precision, performance and form.",
  applicationName: "BUGATTI CHIRON — Anatomy of Speed",
  keywords: ["Bugatti Chiron", "W16", "hypercar", "anatomy of speed", "automotive design"],
  openGraph: {
    title: "BUGATTI CHIRON — Anatomy of Speed",
    description: "An immersive, scroll-driven exploration of the Chiron's precision engineering.",
    url: "https://prasanth-selva.github.io/Bugatti_3d/",
    siteName: "BUGATTI CHIRON — Anatomy of Speed",
    images: [{ url: `${basePath}/hero-webp/frame_0001.webp`, width: 848, height: 480, alt: "Bugatti Chiron in motion" }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "BUGATTI CHIRON — Anatomy of Speed",
    description: "Precision, performance and form — revealed frame by frame.",
    images: [`${basePath}/hero-webp/frame_0001.webp`],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#04120f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        <link rel="preload" as="image" href={`${basePath}/hero-webp/frame_0001.webp`} fetchPriority="high" />
        <link rel="icon" href={`${basePath}/favicon.svg`} type="image/svg+xml" />
      </head>
      <body>{children}</body>
    </html>
  );
}
