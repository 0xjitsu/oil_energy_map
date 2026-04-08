'use client';

import { useEffect, useRef } from 'react';
import type { SupplyChainStage } from '@/data/primer';
import { useElementScrollProgress } from '@/hooks/useElementScrollProgress';
import { AnimatedCounter } from './AnimatedCounter';
import { DataCallout } from './DataCallout';
import { ProportionalBar } from './ProportionalBar';

interface StageBigNumberProps {
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

export function StageBigNumber({ stage, onInView }: StageBigNumberProps) {
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
  const leadDp = stage.dataPoints[0];
  const contextDps = stage.dataPoints.slice(1);

  return (
    <section
      ref={ref}
      id={`stage-${stage.id}`}
      className="primer-stage min-h-[80vh] flex items-center scroll-mt-20"
    >
      <div
        className="w-full max-w-4xl mx-auto transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
        {/* Centered stage badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-3">
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
        </div>

        {/* Giant lead data point */}
        {leadDp && (
          <div className="text-center mb-4">
            <div className="flex justify-center">
              {renderDataPoint(leadDp, stage.color, 0)}
            </div>
          </div>
        )}

        {/* Title + headline */}
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary text-center mb-2">
          {stage.title}
        </h2>
        <p
          className="text-lg sm:text-xl font-semibold text-center mb-8"
          style={{ color: stage.color }}
        >
          {stage.headline}
        </p>

        {/* Context stats grid */}
        {contextDps.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            {contextDps.map((dp, i) => (
              <div key={dp.label} className="glass-card p-4 text-center">
                {renderDataPoint(dp, stage.color, i * 150)}
              </div>
            ))}
          </div>
        )}

        {/* Narrative cards in 2-col grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="glass-card p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-text-muted mb-2">
              What happens here
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
              {stage.what}
            </p>
          </div>

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

        {/* Key players as chip row */}
        <div className="mb-8">
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

        {/* Proportional bars */}
        {stage.bars && stage.bars.length > 0 && (
          <div className="space-y-3 max-w-md mx-auto">
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
    </section>
  );
}
