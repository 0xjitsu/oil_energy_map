'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import type { SupplyChainStage } from '@/data/primer';
import { useElementScrollProgress } from '@/hooks/useElementScrollProgress';
import { AnimatedCounter } from './AnimatedCounter';
import { DataCallout } from './DataCallout';
import { ProportionalBar } from './ProportionalBar';

interface StageSplitNarrativeProps {
  stage: SupplyChainStage;
  onInView: (stageNumber: number) => void;
}

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

export function StageSplitNarrative({ stage, onInView }: StageSplitNarrativeProps) {
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
      {/* Header image */}
      <div className="relative h-48 sm:h-64 rounded-xl overflow-hidden mb-8">
        <Image
          src={stage.imageUrl}
          alt={stage.imageAlt}
          fill
          className="object-cover"
          loading="lazy"
          sizes="(max-width: 1024px) 100vw, 896px"
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, var(--bg-primary), transparent 60%), linear-gradient(to right, color-mix(in srgb, ${stage.color} 20%, transparent), transparent)`,
          }}
        />
        {/* Badge on image */}
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg backdrop-blur-sm"
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
      </div>

      {/* Title + headline */}
      <div
        className="transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
        }}
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          {stage.title}
        </h2>
        <p
          className="text-lg sm:text-xl font-semibold mb-8"
          style={{ color: stage.color }}
        >
          {stage.headline}
        </p>
      </div>

      {/* Two-column layout */}
      <div
        className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
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

        {/* Right: sticky data panel */}
        <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
          {stage.dataPoints.map((dp, i) => renderDataPoint(dp, stage.color, i * 150))}

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
    </section>
  );
}
