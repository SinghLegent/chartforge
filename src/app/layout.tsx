import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChartForge",
  description: "Charts that work on phone, tablet, and desktop",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ChartForge",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0b0e11",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased overflow-hidden">{children}</body>
    </html>
  );
}
