import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChartForge — Charts that work",
  description: "Open-source style charting workspace. Clean-room rebuild focused on Supercharts features.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
