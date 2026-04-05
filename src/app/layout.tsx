import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#060a10",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

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

const jsonLdData = [
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "PH Energy Intelligence Map",
    url: "https://energy-intelligence-map.vercel.app",
    description:
      "Monitor Philippine fuel prices, crude oil benchmarks, and supply chain risks in real time.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    sourceOrganization: {
      "@type": "Organization",
      name: "0xjitsu",
      url: "https://github.com/0xjitsu",
    },
    codeRepository: "https://github.com/0xjitsu/oil_energy_map",
  },
  {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "Philippine Gas Station Network",
    description:
      "10,469 gas stations across the Philippines with brand, coordinates, fuel types, and regional classification. Sourced from OpenStreetMap.",
    url: "https://energy-intelligence-map.vercel.app/references",
    license: "https://opendatacommons.org/licenses/odbl/",
    creator: {
      "@type": "Organization",
      name: "OpenStreetMap Contributors",
      url: "https://www.openstreetmap.org",
    },
    spatialCoverage: {
      "@type": "Place",
      name: "Philippines",
    },
    temporalCoverage: "2024/..",
    variableMeasured: [
      "Brent Crude Price (USD/barrel)",
      "PHP/USD Exchange Rate",
      "Gasoline Pump Price (PHP/liter)",
      "Diesel Pump Price (PHP/liter)",
    ],
  },
];

function JsonLd() {
  return (
    <>
      {jsonLdData.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          // Static data only — no user input, safe from XSS
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plexMono.variable} ${plexSans.variable}`} style={{ colorScheme: 'dark' }}>
      <head>
        <link rel="preconnect" href="https://basemaps.cartocdn.com" />
        <link rel="dns-prefetch" href="https://query1.finance.yahoo.com" />
        <link rel="dns-prefetch" href="https://www.floatrates.com" />
        <meta name="source-code" content="https://github.com/0xjitsu/oil_energy_map" />
        <link rel="author" href="https://github.com/0xjitsu" />
        <JsonLd />
      </head>
      <body className="font-sans antialiased bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <a
          href="#snapshot"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-4 focus:py-2 focus:bg-petron focus:text-white focus:rounded-lg focus:text-sm focus:font-mono"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
