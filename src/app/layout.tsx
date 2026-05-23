import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider, THEME_INIT_SCRIPT } from "@/components/theme-provider";
import { env } from "@/lib/env";
import "./globals.css";

const APP_NAME = "Abkon Laundromat";
const APP_DESCRIPTION =
  "Lagos laundromat with home pickup and delivery. Wash, iron, wash + iron, and dry cleaning — done right in 2 days. Book in 30 seconds on WhatsApp or walk into our showroom.";

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: {
    default: `${APP_NAME} — Clean clothes, done right`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  authors: [{ name: APP_NAME }],
  creator: APP_NAME,
  publisher: APP_NAME,
  generator: "Next.js",
  category: "Local Services",
  keywords: [
    "laundromat Lagos",
    "laundry pickup Lagos",
    "dry cleaning Lagos",
    "Ikeja laundry",
    "Maryland laundry",
    "Ojota laundry",
    "WhatsApp laundry booking",
    "agbada cleaning",
    "senator wear laundry",
    "duvet washing Lagos",
    "ankara dry cleaning",
    "Abkon Laundromat",
  ],
  formatDetection: { email: false, address: false, telephone: false },
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: env.APP_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Clean clothes, done right`,
    description: APP_DESCRIPTION,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: APP_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Clean clothes, done right`,
    description: APP_DESCRIPTION,
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-icon.png", type: "image/png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1226" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  colorScheme: "light dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {/*
         * No-flash theme init. Using next/script with `beforeInteractive` so
         * Next renders the script in <head> outside React's reconciliation
         * tree — this avoids the React 19 "inline script inside component"
         * warning while still running before hydration.
         */}
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
