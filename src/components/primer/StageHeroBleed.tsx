'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import type { SupplyChainStage } from '@/data/primer';
import { useElementScrollProgress } from '@/hooks/useElementScrollProgress';
import { AnimatedCounter } from './AnimatedCounter';
import { DataCallout } from './DataCallout';
import { ProportionalBar } from './ProportionalBar';

interface StageHeroBleedProps {
  stage: SupplyChainStage;
  onInView: (stageNumber: number) => void;
}

export function StageHeroBleed({ stage, onInView }: StageHeroBleedProps) {
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
  const restDps = stage.dataPoints.slice(1);
  const isFirst = stage.number === 1;

  // Parse numeric from lead data point
  const numericMatch = leadDp?.value.match(/^([₱$]?)([0-9,.]+)(.*)$/);
  const isNumeric = numericMatch && !isNaN(parseFloat(numericMatch[2].replace(/,/g, '')));

  return (
    <section
      ref={ref}
      id={`stage-${stage.id}`}
      className="primer-stage relative min-h-[90vh] flex items-center scroll-mt-20 overflow-hidden"
    >
      {/* Background image with parallax */}
      <div
        className="absolute inset-0 z-0"
        style={{
          transform: `translateY(${(progress - 0.5) * -60}px)`,
        }}
      >
        <Image
          src={stage.imageUrl}
          alt={stage.imageAlt}
          fill
          className="object-cover"
          style={{ opacity: 0.15 }}
          priority={isFirst}
          loading={isFirst ? 'eager' : 'lazy'}
          sizes="100vw"
        />
      </div>

      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 z-[1]"
        style={{
          background: `radial-gradient(ellipse at 30% 50%, color-mix(in srgb, ${stage.color} 10%, transparent), var(--bg-primary) 70%)`,
        }}
      />

      {/* Content */}
      <div
        className="relative z-[2] w-full max-w-4xl mx-auto px-4 sm:px-6 transition-all duration-700 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(30px)',
        }}
      >
        {/* Stage badge */}
        <div className="flex items-center gap-3 mb-4">
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

        {/* Giant lead data point */}
        {leadDp && (
          <div className="mb-6">
            {isNumeric && numericMatch ? (
              <AnimatedCounter
                end={parseFloat(numericMatch[2].replace(/,/g, ''))}
                prefix={numericMatch[1]}
                suffix={numericMatch[3]}
                decimals={numericMatch[2].includes('.') ? numericMatch[2].split('.')[1].length : 0}
                color={stage.color}
                label={leadDp.label}
                source={leadDp.source}
              />
            ) : (
              <DataCallout
                value={leadDp.value}
                label={leadDp.label}
                source={leadDp.source}
                color={stage.color}
              />
            )}
          </div>
        )}

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

        {/* Description */}
        <p className="text-sm text-text-secondary leading-relaxed max-w-2xl mb-8">
          {stage.what}
        </p>

        {/* Stat pills row */}
        {restDps.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-8">
            {restDps.map((dp, i) => {
              const match = dp.value.match(/^([₱$]?)([0-9,.]+)(.*)$/);
              const isNum = match && !isNaN(parseFloat(match[2].replace(/,/g, '')));
              return (
                <div
                  key={dp.label}
                  className="glass-card px-4 py-3 flex-1 min-w-[140px]"
                >
                  {isNum && match ? (
                    <AnimatedCounter
                      end={parseFloat(match[2].replace(/,/g, ''))}
                      prefix={match[1]}
                      suffix={match[3]}
                      decimals={match[2].includes('.') ? match[2].split('.')[1].length : 0}
                      color={stage.color}
                      label={dp.label}
                      source={dp.source}
                    />
                  ) : (
                    <DataCallout
                      value={dp.value}
                      label={dp.label}
                      source={dp.source}
                      color={stage.color}
                      delay={i * 150}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* PH Context box */}
        <div
          className="rounded-xl p-5 mb-8"
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

        {/* Proportional bars */}
        {stage.bars && stage.bars.length > 0 && (
          <div className="space-y-3 max-w-md">
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
