import type { Metadata } from 'next';

/**
 * Bare layout for embeddable widget routes. These pages are designed to be
 * iframed into third-party sites, so they deliberately omit the dashboard
 * header, footer, ticker, and section nav. The root layout still provides
 * fonts, the design-token CSS, and providers.
 */
export const metadata: Metadata = {
  // Embedded widgets should not be indexed as standalone pages.
  robots: { index: false, follow: false },
};

export default function EmbedLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <div className="min-h-screen bg-bg-primary">{children}</div>;
}
