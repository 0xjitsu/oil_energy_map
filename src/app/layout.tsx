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
  title: "PH Oil Intelligence — Supply Chain Dashboard",
  description:
    "Real-time intelligence dashboard for Philippine oil supply chain. Track crude prices, refinery status, shipping routes, and geopolitical risk factors affecting fuel costs.",
  metadataBase: new URL("https://energy-intelligence-map.vercel.app"),
  openGraph: {
    title: "PH Oil Intelligence",
    description: "Philippine Oil Supply Chain Intelligence Dashboard — WebGL mapping, multi-channel event feeds, scenario planning",
    type: "website",
    url: "https://energy-intelligence-map.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "PH Oil Intelligence",
    description: "Real-time Philippine oil supply chain intelligence dashboard",
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
