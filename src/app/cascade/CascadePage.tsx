'use client';

import dynamic from 'next/dynamic';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileWaterfall } from '@/components/cascade/MobileWaterfall';
import { cascadeStats, SEVERITY_COLORS } from '@/data/cascade';

const SankeyDiagram = dynamic(
  () => import('@/components/cascade/SankeyDiagram').then((m) => m.SankeyDiagram),
  {
    ssr: false,
    loading: () => (
      <div className="glass-card rounded-xl p-6 min-h-[500px] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-[700px]">
          <div className="h-4 bg-border-subtle rounded animate-pulse w-3/4 mx-auto" />
          <div className="h-64 bg-border-subtle rounded animate-pulse" />
          <div className="flex gap-4 justify-center">
            <div className="h-3 bg-border-subtle rounded animate-pulse w-20" />
            <div className="h-3 bg-border-subtle rounded animate-pulse w-20" />
            <div className="h-3 bg-border-subtle rounded animate-pulse w-20" />
          </div>
        </div>
      </div>
    ),
  },
);

const STAT_PILLS = [
  {
    label: 'Nodes tracked',
    value: cascadeStats.totalNodes.toString(),
    color: SEVERITY_COLORS.moderate,
  },
  {
    label: 'Causal links',
    value: cascadeStats.totalLinks.toString(),
    color: SEVERITY_COLORS.moderate,
  },
  {
    label: 'Critical',
    value: cascadeStats.criticalCount.toString(),
    color: SEVERITY_COLORS.critical,
  },
  {
    label: 'High',
    value: cascadeStats.highCount.toString(),
    color: SEVERITY_COLORS.high,
  },
];

export function CascadePage() {
  return (
    <div className="min-h-screen bg-bg-primary overflow-x-clip">
      <ScrollProgress />
      <Header showTicker={false} />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">
        {/* Hero */}
        <section className="text-center py-12 sm:py-16">
          <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-status-red/20 bg-status-red/5 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-red opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-status-red" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-status-red">
              Live Cascade Tracker
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-4">
            Second-Order Effects
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-text-secondary leading-relaxed">
            Energy disruptions don&apos;t stop at the pump. Track how oil price shocks
            ripple through fertilizer, food, transport, and household budgets
            across the Philippine economy.
          </p>
        </section>

        {/* Stats row */}
        <div className="flex flex-wrap gap-2 mb-6">
          {STAT_PILLS.map((pill) => (
            <div
              key={pill.label}
              className="glass-card px-3 py-1.5 flex items-center gap-2"
            >
              <span
                className="font-mono text-sm font-bold"
                style={{ color: pill.color }}
              >
                {pill.value}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest text-text-dim">
                {pill.label}
              </span>
            </div>
          ))}
        </div>

        {/* Desktop: Sankey diagram */}
        <div className="hidden md:block">
          <div className="glass-card rounded-xl p-6">
            <SankeyDiagram />
          </div>
        </div>

        {/* Mobile: Waterfall */}
        <div className="md:hidden">
          <MobileWaterfall />
        </div>

        {/* Attribution footer */}
        <div className="text-[10px] text-text-dim text-center pt-6 mt-8 border-t border-border-subtle">
          Data from DOE Oil Monitor, PSA, DA Price Watch, LTFRB, and industry reports.
          Cascade links are modeled, not predictive.
        </div>
      </main>

      <Footer />
    </div>
  );
}
