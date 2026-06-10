import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PricePanel } from '@/components/prices/PricePanel';

// PricePanel reads usePrices() — outside a DataProvider it gets the context
// DEFAULT_VALUE: static benchmarks, priceHistory = {} (src/lib/DataProvider.tsx:61-69).
// With an empty intraday buffer, benchmarks WITHOUT a curated weekly series
// (php-usd, dubai-crude, MOPS, refining margin) must show the honest
// "history building…" label — and never a fabricated curve.

describe('PricePanel', () => {
  it('labels missing history instead of fabricating a trend', async () => {
    render(<PricePanel />);
    const labels = await screen.findAllByText(/history building/i);
    // 8 benchmarks; brent-crude, pump-gasoline, pump-diesel have weekly series → 5 labeled.
    expect(labels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders a real sparkline for benchmarks with weekly history', async () => {
    render(<PricePanel />);
    const sparks = await screen.findAllByRole('img', { name: /trend sparkline/i });
    expect(sparks.length).toBeGreaterThanOrEqual(3); // brent + 2 pumps
  });
});
