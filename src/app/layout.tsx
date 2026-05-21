import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Abkon Laundromat", template: "%s · Abkon Laundromat" },
  description: "Professional laundry services with home pickup and delivery. Wash, iron, dry clean — done right.",
  applicationName: "Abkon Laundromat",
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0284c7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
