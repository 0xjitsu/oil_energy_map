'use client';

import { useEffect, useRef, useState } from 'react';
import type { SupplyChainStage } from '@/data/primer';
import { DataCallout } from './DataCallout';
import { ProportionalBar } from './ProportionalBar';
import { AnimatedCounter } from './AnimatedCounter';

interface StageSectionProps {
  stage: SupplyChainStage;
  onInView: (stageNumber: number) => void;
}

export function StageSection({ stage, onInView }: StageSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // SSR-safe: check if already in viewport on mount
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
      onInView(stage.number);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          onInView(stage.number);
        }
      },
      { threshold: 0.2, rootMargin: '-10% 0px -10% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [stage.number, onInView]);

  return (
    <section
      ref={ref}
      id={`stage-${stage.id}`}
      className="primer-stage min-h-[80vh] flex items-center scroll-mt-20"
    >
      <div
        className="relative w-full max-w-4xl mx-auto transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
        {/* Stage number accent strip */}
        <div
          className="absolute left-0 right-0 h-px opacity-20"
          style={{ backgroundColor: stage.color, top: '2rem' }}
        />

        {/* Stage divider */}
        {stage.number > 1 && <div className="stage-divider mb-12" />}

        {/* Stage badge */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
            style={{
              background: `color-mix(in srgb, ${stage.color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${stage.color} 25%, transparent)`,
            }}
          >
            {stage.icon}
          </div>
          <span
            className="text-[10px] font-mono tracking-widest uppercase"
            style={{ color: stage.color }}
          >
            Stage {stage.number}
          </span>
        </div>

        {/* Title + headline */}
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          {stage.title}
        </h2>
        <p
          className="text-lg sm:text-xl font-semibold mb-6"
          style={{ color: stage.color }}
        >
          {stage.headline}
        </p>

        {/* Two-column layout: narrative left, callouts right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">
          {/* Left: narrative */}
          <div className="space-y-4">
            {/* What happens here */}
            <div className="glass-card p-5">
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">
                What happens here
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {stage.what}
              </p>
            </div>

            {/* PH Context */}
            <div
              className="rounded-xl p-5"
              style={{
                background: 'color-mix(in srgb, var(--ph-blue) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--ph-blue) 15%, transparent)',
              }}
            >
              <p className="text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: 'var(--ph-blue)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--ph-blue)' }} />
                Philippine Context
              </p>
              <p className="text-sm text-text-secondary leading-relaxed">
                {stage.phContext}
              </p>
            </div>

            {/* Key Players */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">
                Key Players
              </p>
              <div className="flex flex-wrap gap-2">
                {stage.keyPlayers.map((player) => (
                  <span
                    key={player}
                    className="inline-block text-xs font-mono px-2.5 py-1 rounded-md bg-border border border-border-subtle text-text-secondary"
                  >
                    {player}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: data callouts */}
          <div className="flex flex-col gap-6 lg:pt-2">
            {stage.dataPoints.map((dp, i) => {
              // Parse numeric values for animated counter
              const numericMatch = dp.value.match(/^([₱$]?)([0-9,.]+)(.*)$/);
              if (numericMatch) {
                const [, prefix, numStr, suffix] = numericMatch;
                const num = parseFloat(numStr.replace(/,/g, ''));
                if (!isNaN(num)) {
                  return (
                    <AnimatedCounter
                      key={dp.label}
                      end={num}
                      prefix={prefix}
                      suffix={suffix}
                      decimals={numStr.includes('.') ? numStr.split('.')[1].length : 0}
                      color={stage.color}
                      label={dp.label}
                      source={dp.source}
                    />
                  );
                }
              }
              // Fallback to DataCallout for non-numeric values
              return (
                <DataCallout
                  key={dp.label}
                  value={dp.value}
                  label={dp.label}
                  source={dp.source}
                  color={stage.color}
                  delay={i * 150}
                />
              );
            })}

            {/* Proportional bars */}
            {stage.bars && stage.bars.length > 0 && (
              <div className="space-y-3 mt-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-text-dim">
                  By the numbers
                </span>
                {stage.bars.map((bar) => (
                  <ProportionalBar
                    key={bar.label}
                    value={bar.value}
                    label={bar.label}
                    color={bar.color ?? stage.color}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
