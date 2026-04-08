'use client';

import { useEffect, useRef } from 'react';
import type { SupplyChainStage } from '@/data/primer';
import { useElementScrollProgress } from '@/hooks/useElementScrollProgress';
import { AnimatedCounter } from './AnimatedCounter';
import { DataCallout } from './DataCallout';
import { ProportionalBar } from './ProportionalBar';

interface StageStackedCardsProps {
  stage: SupplyChainStage;
  onInView: (stageNumber: number) => void;
}

const REFINERY_STEPS = [
  {
    title: 'Crude Intake',
    description: 'Raw crude is desalted and pre-heated before entering the distillation tower. Impurities and water are removed.',
    icon: '🛢️',
  },
  {
    title: 'Distillation',
    description: 'Crude is heated to 400°C+ in atmospheric and vacuum columns. Lighter products rise, heavier ones sink.',
    icon: '🌡️',
  },
  {
    title: 'Cracking',
    description: 'Heavy residue is broken into lighter, more valuable products through catalytic and hydrocracking processes.',
    icon: '⚡',
  },
  {
    title: 'Blending & QC',
    description: 'Finished products (gasoline, diesel, jet fuel) are blended to specification and tested before storage.',
    icon: '🧪',
  },
];

function renderDataPoint(dp: { value: string; label: string; source?: string }, color: string, delay: number) {
  const match = dp.value.match(/^([₱$]?)([0-9,.]+)(.*)$/);
  const isNum = match && !isNaN(parseFloat(match[2].replace(/,/g, '')));
  if (isNum && match) {
    return (
      <AnimatedCounter
        key={dp.label}
        end={parseFloat(match[2].replace(/,/g, ''))}
        prefix={match[1]}
        suffix={match[3]}
        decimals={match[2].includes('.') ? match[2].split('.')[1].length : 0}
        color={color}
        label={dp.label}
        source={dp.source}
      />
    );
  }
  return (
    <DataCallout
      key={dp.label}
      value={dp.value}
      label={dp.label}
      source={dp.source}
      color={color}
      delay={delay}
    />
  );
}

export function StageStackedCards({ stage, onInView }: StageStackedCardsProps) {
  const { ref, progress, isInView } = useElementScrollProgress<HTMLElement>();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if (isInView && !notifiedRef.current) {
      notifiedRef.current = true;
      onInView(stage.number);
    }
    if (!isInView) {
      notifiedRef.current = false;
    }
  }, [isInView, stage.number, onInView]);

  const visible = progress > 0.15;

  return (
    <section
      ref={ref}
      id={`stage-${stage.id}`}
      className="primer-stage min-h-[80vh] flex flex-col scroll-mt-20"
    >
      {/* Header */}
      <div
        className="mb-8 transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
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
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          {stage.title}
        </h2>
        <p
          className="text-lg sm:text-xl font-semibold"
          style={{ color: stage.color }}
        >
          {stage.headline}
        </p>
      </div>

      {/* Horizontal scrollable card row */}
      <div className="relative mb-8">
        {/* Fade edge indicators */}
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-bg-primary to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-bg-primary to-transparent z-10 pointer-events-none" />

        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 px-1 scrollbar-thin"
          style={{ scrollbarColor: 'var(--border-hover) transparent' }}
        >
          {REFINERY_STEPS.map((step, i) => {
            const dp = stage.dataPoints[i];
            return (
              <div
                key={step.title}
                className="glass-card p-5 min-w-[280px] max-w-[320px] flex-shrink-0 snap-center transition-all duration-500 ease-out"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(20px)',
                  transitionDelay: `${i * 100}ms`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl" aria-hidden="true">{step.icon}</span>
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest"
                    style={{ color: stage.color }}
                  >
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="text-base font-bold text-text-primary mb-2">
                  {step.title}
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  {step.description}
                </p>
                {dp && (
                  <div className="border-t border-border-subtle pt-3">
                    {renderDataPoint(dp, stage.color, i * 150)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Narrative cards in 2-col grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transitionDelay: '400ms',
        }}
      >
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
          <p
            className="text-[10px] font-mono uppercase tracking-widest mb-2 flex items-center gap-1.5"
            style={{ color: 'var(--ph-blue)' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--ph-blue)' }}
            />
            Philippine Context
          </p>
          <p className="text-sm text-text-secondary leading-relaxed">
            {stage.phContext}
          </p>
        </div>
      </div>

      {/* Proportional bars */}
      {stage.bars && stage.bars.length > 0 && (
        <div
          className="space-y-3 max-w-md transition-all duration-700 ease-out"
          style={{
            opacity: visible ? 1 : 0,
            transitionDelay: '500ms',
          }}
        >
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

      {/* Swipe hint */}
      <p className="text-[10px] font-mono text-text-dim text-center mt-4 lg:hidden">
        Swipe to explore process steps
      </p>
    </section>
  );
}
