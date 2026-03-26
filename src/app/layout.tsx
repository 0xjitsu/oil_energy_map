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
  openGraph: {
    title: "PH Oil Intelligence",
    description: "Philippine Oil Supply Chain Intelligence Dashboard",
    type: "website",
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
