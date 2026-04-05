import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PH Energy Intelligence Map — Live Oil Supply Chain Dashboard",
  description:
    "Monitor Philippine fuel prices, crude oil benchmarks, and supply chain risks in real time. 10,469 gas stations mapped, live RSS news feeds, Monte Carlo stress testing, and what-if scenario planning — built for everyday drivers and cabinet-level decision makers alike.",
  metadataBase: new URL("https://energy-intelligence-map.vercel.app"),
  openGraph: {
    title: "PH Energy Intelligence Map",
    description: "Live Philippine oil supply chain dashboard — track Brent crude, pump prices, 10,469 stations, and geopolitical risks with scenario planning and Monte Carlo simulation.",
    type: "website",
    url: "https://energy-intelligence-map.vercel.app",
    siteName: "PH Energy Intelligence Map",
  },
  twitter: {
    card: "summary_large_image",
    title: "PH Energy Intelligence Map",
    description: "Live Philippine oil supply chain dashboard — track Brent crude, pump prices, 10,469 stations, and geopolitical risks with scenario planning and Monte Carlo simulation.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plexMono.variable} ${plexSans.variable}`}>
      <head>
        <link rel="preconnect" href="https://basemaps.cartocdn.com" />
      </head>
      <body className="font-sans antialiased bg-[var(--bg-primary)] text-[var(--text-primary)]">
        {children}
      </body>
    </html>
  );
}
