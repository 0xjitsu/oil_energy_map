import type { Metadata } from 'next';
import { decodeScenario, encodeScenario } from '@/lib/scenario-url';
import { calculatePumpPrice } from '@/lib/scenario-engine';
import { EmbedScenarioCard } from './EmbedScenarioCard';

interface EmbedScenarioPageProps {
  searchParams: { s?: string };
}

export function generateMetadata({ searchParams }: EmbedScenarioPageProps): Metadata {
  // Re-encode the decoded scenario so the OG image URL is always canonical,
  // even when the incoming `?s=` was malformed or out of range.
  const encoded = encodeScenario(decodeScenario(searchParams.s ?? null));
  const ogImage = `/embed/scenario/og?s=${encoded}`;
  return {
    title: 'PH Oil — Modeled Scenario',
    robots: { index: false, follow: false },
    openGraph: {
      title: 'PH Oil — Modeled Scenario',
      description: 'A modeled Philippine fuel-price scenario.',
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: { card: 'summary_large_image', images: [ogImage] },
  };
}

export default function EmbedScenarioPage({ searchParams }: EmbedScenarioPageProps) {
  const params = decodeScenario(searchParams.s ?? null);
  // Touch the engine here too so a malformed `s` is caught server-side before render.
  calculatePumpPrice(params);

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <EmbedScenarioCard params={params} />
    </main>
  );
}
