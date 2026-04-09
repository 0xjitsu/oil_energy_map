'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileWaterfall } from '@/components/cascade/MobileWaterfall';
import {
  cascadeHeadline,
  cascadeChainPath,
  cascadeStages,
  criticalInsight,
  SEVERITY_COLORS,
} from '@/data/cascade';
import type { CascadeCategory } from '@/types/cascade';

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

export function CascadePage() {
  const [activeStage, setActiveStage] = useState<CascadeCategory | null>(null);

  return (
    <div className="min-h-screen bg-bg-primary overflow-x-clip">
      <ScrollProgress />
      <Header showTicker={false} />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6">

        {/* ── Hero: Lead with human impact ── */}
        <section className="py-10 sm:py-14">
          <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-status-red/20 bg-status-red/5 px-4 py-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-status-red opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-status-red" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-status-red">
              Live Cascade Tracker
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-text-primary mb-3 max-w-3xl">
            {cascadeHeadline.householdImpact}nth
            <span className="text-text-secondary font-normal text-xl sm:text-2xl md:text-3xl block mt-1">
              — what {cascadeHeadline.crudePrice} oil costs a Filipino family
            </span>
          </h1>

          <p className="max-w-2xl text-sm sm:text-base text-text-body leading-relaxed mt-4">
            Energy disruptions don&apos;t stop at the pump. Every dollar added to crude oil
            cascades through diesel, fertilizer, food prices, and transport fares — until
            it lands on the household budget. This tracker maps those second-order effects
            across the Philippine economy.
          </p>
        </section>

        {/* ── Critical Chain: The story in 5 nodes ── */}
        <section className="mb-8">
          <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-3">
            The Critical Path
          </div>
          <div className="glass-card rounded-xl p-4 sm:p-5 overflow-x-auto">
            <div className="flex items-stretch gap-1 sm:gap-2 min-w-max sm:min-w-0">
              {cascadeChainPath.map((step, i) => (
                <div key={step.nodeId} className="flex items-center gap-1 sm:gap-2">
                  {/* Node card */}
                  <div
                    className="glass-card px-3 py-2.5 sm:px-4 sm:py-3 rounded-lg flex-shrink-0 transition-colors duration-200 hover:bg-surface-hover cursor-default"
                    style={{
                      borderBottom: `2px solid ${SEVERITY_COLORS[step.node.severity]}`,
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base" aria-hidden="true">{step.node.icon}</span>
                      <span className="font-mono text-[10px] text-text-secondary uppercase tracking-wider">
                        {step.node.label}
                      </span>
                    </div>
                    <div
                      className="font-mono text-lg sm:text-xl font-bold"
                      style={{ color: SEVERITY_COLORS[step.node.severity] }}
                    >
                      {step.node.currentValue}
                    </div>
                    <div className="font-mono text-[10px] text-status-red mt-0.5">
                      +{step.node.changePercent}%
                    </div>
                  </div>

                  {/* Arrow connector */}
                  {step.arrow && (
                    <div className="flex flex-col items-center gap-0.5 px-1 flex-shrink-0">
                      <svg width="24" height="16" viewBox="0 0 24 16" aria-hidden="true" className="text-text-dim">
                        <path
                          d="M2 8h16m0 0l-4-4m4 4l-4 4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {i < cascadeChainPath.length - 2 && (
                        <span className="text-[8px] font-mono text-text-dim whitespace-nowrap">
                          {i === 0 ? '1–2 wk' : i === 1 ? '1–3 mo' : '1 mo'}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stage Navigator ── */}
        <section className="mb-6">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveStage(null)}
              className={`px-3 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest transition-colors duration-200 whitespace-nowrap min-h-[44px] ${
                activeStage === null
                  ? 'bg-border-hover text-text-primary'
                  : 'text-text-secondary hover:bg-surface-hover'
              }`}
            >
              All stages
            </button>
            {cascadeStages.map((stage) => (
              <button
                key={stage.category}
                onClick={() =>
                  setActiveStage(activeStage === stage.category ? null : stage.category)
                }
                className={`px-3 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest transition-colors duration-200 flex items-center gap-2 whitespace-nowrap min-h-[44px] ${
                  activeStage === stage.category
                    ? 'bg-border-hover text-text-primary'
                    : 'text-text-secondary hover:bg-surface-hover'
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: stage.color }}
                />
                {stage.shortLabel}
                <span className="text-text-dim">{stage.nodeCount}</span>
              </button>
            ))}
          </div>

          {/* Stage description */}
          {activeStage && (
            <div
              className="mt-2 px-3 py-2 rounded-lg text-xs text-text-body font-sans"
              style={{
                borderLeft: `3px solid ${cascadeStages.find(s => s.category === activeStage)?.color}`,
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              {cascadeStages.find(s => s.category === activeStage)?.description}
            </div>
          )}
        </section>

        {/* ── Sankey Diagram (Desktop) ── */}
        <div className="hidden md:block">
          <div className="glass-card rounded-xl p-6">
            <SankeyDiagram />
          </div>
        </div>

        {/* ── Mobile Waterfall ── */}
        <div className="md:hidden">
          <MobileWaterfall />
        </div>

        {/* ── Key Insight Callout ── */}
        <section className="mt-8">
          <div
            className="glass-card rounded-xl p-5 sm:p-6"
            style={{
              borderLeft: `3px solid ${SEVERITY_COLORS[criticalInsight.severity]}`,
            }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center bg-status-red/10 text-status-red text-lg">
                ⚡
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-widest text-status-red mb-1">
                  Key Insight
                </div>
                <h3 className="font-bold text-text-primary text-base sm:text-lg mb-2">
                  {criticalInsight.headline}
                </h3>
                <p className="text-sm text-text-body leading-relaxed">
                  {criticalInsight.body}
                </p>
                <div className="flex items-center gap-4 mt-3 text-[10px] font-mono text-text-secondary">
                  <span>
                    <strong className="text-text-primary">{criticalInsight.affectedNodes}</strong> of {criticalInsight.totalNodes} nodes affected directly
                  </span>
                  <span
                    className="uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{
                      color: SEVERITY_COLORS[criticalInsight.severity],
                      backgroundColor: `${SEVERITY_COLORS[criticalInsight.severity]}15`,
                    }}
                  >
                    {criticalInsight.severity}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Methodology & Attribution ── */}
        <footer className="mt-10 pt-6 border-t border-border-subtle">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[10px] font-mono text-text-dim">
            <div>
              <div className="text-text-label uppercase tracking-widest mb-1">Data Sources</div>
              <p className="leading-relaxed">
                DOE Oil Monitor, PSA Consumer Price Index, DA Price Watch,
                LTFRB fare orders, BFAR fisheries data, and industry reports.
              </p>
            </div>
            <div>
              <div className="text-text-label uppercase tracking-widest mb-1">Methodology</div>
              <p className="leading-relaxed">
                Cascade links are modeled based on historical pass-through
                rates and published elasticities. Magnitudes indicate relative
                impact strength, not precise multipliers. Time lags are approximate.
              </p>
            </div>
          </div>
        </footer>
      </main>

      <Footer />
    </div>
  );
}
