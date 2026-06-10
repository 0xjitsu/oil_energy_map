'use client';

import { useCrisis } from '@/lib/CrisisProvider';
import { usePrices } from '@/hooks/usePrices';
import { formatPHP } from '@/lib/format';
import type { CrisisLevel } from '@/lib/crisisLevel';

interface LevelFraming {
  lead: string;
  tone: string;
}

const LEVEL_FRAMING: Record<CrisisLevel, LevelFraming> = {
  CALM: {
    lead: 'Philippine energy supply is steady — for now.',
    tone: 'text-status-green',
  },
  ELEVATED: {
    lead: 'Philippine energy is under elevated stress.',
    tone: 'text-status-yellow',
  },
  CRISIS: {
    lead: 'Philippine energy is in crisis.',
    tone: 'text-status-red',
  },
};

/** Pure: compose the week-over-week diesel sentence. */
export function composeDieselLine(value: number, delta: number): string {
  const price = `${formatPHP(value)}/L`;
  if (delta > 0.01) return `Diesel is ${price} — up ${formatPHP(delta)} this week.`;
  if (delta < -0.01) return `Diesel is ${price} — down ${formatPHP(Math.abs(delta))} this week.`;
  return `Diesel is ${price} — flat this week.`;
}

/**
 * Act 0 — the dashboard's narrative opener. A first-time visitor should grasp
 * "is this a crisis, and should I care?" within ten seconds of landing here.
 */
export function CrisisHero() {
  const { crisisLevel } = useCrisis();
  const { prices } = usePrices();

  const framing = LEVEL_FRAMING[crisisLevel];
  const diesel = prices.find((p) => p.id === 'pump-diesel');
  const dieselLine = diesel
    ? composeDieselLine(diesel.value, diesel.value - diesel.previousWeek)
    : '';

  return (
    <section className="glass-card px-6 py-10 sm:px-10 sm:py-14 text-center">
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-label mb-4">
        PH Energy Intelligence · Live
      </p>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
        <span className={framing.tone}>{framing.lead}</span>
      </h1>
      <p className="mt-4 text-text-body text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
        {dieselLine ? `${dieselLine} ` : ''}
        Here&apos;s why, and what it costs your family.
      </p>
      <a
        href="#snapshot"
        className="inline-flex items-center gap-1.5 mt-6 font-mono text-xs uppercase tracking-widest text-petron hover:text-text-primary transition-colors"
      >
        See the numbers ↓
      </a>
    </section>
  );
}
