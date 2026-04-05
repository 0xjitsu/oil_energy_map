'use client';

import { usePrices } from '@/hooks/usePrices';
import { useEvents } from '@/hooks/useEvents';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { SparkChart } from '@/components/prices/SparkChart';
import { InfoTip } from '@/components/ui/Tooltip';
import type { ScenarioParams } from '@/types';

function getRiskLevel(params: ScenarioParams): { label: string; color: string; bg: string } {
  const score =
    params.hormuzWeeks / 16 +
    (params.refineryOffline ? 0.3 : 0) +
    (params.brentPrice - 106) / 150;
  if (score > 0.6) return { label: 'CRITICAL', color: 'text-red-400', bg: 'bg-red-400/10' };
  if (score > 0.3) return { label: 'HIGH', color: 'text-amber-400', bg: 'bg-amber-400/10' };
  if (score > 0.1) return { label: 'MODERATE', color: 'text-yellow-400', bg: 'bg-yellow-400/10' };
  return { label: 'LOW', color: 'text-emerald-400', bg: 'bg-emerald-400/10' };
}

function formatValue(value: number, unit: string): string {
  if (unit === '$/bbl') return `$${value.toFixed(1)}`;
  if (unit === '₱/$') return `₱${value.toFixed(2)}`;
  return `₱${value.toFixed(2)}`;
}

function HeroKPI({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  sparkData,
  sparkColor,
  accentBorder,
  tooltip,
  source,
}: {
  label: string;
  value: number;
  unit: string;
  delta: number;
  deltaLabel: string;
  sparkData: number[];
  sparkColor: string;
  accentBorder: string;
  tooltip: string;
  source?: 'live' | 'derived';
}) {
  const animated = useAnimatedNumber(value);
  const isUp = delta > 0;
  const base = value - delta;
  const pctChange = base !== 0 ? (delta / Math.abs(base)) * 100 : 0;

  return (
    <div
      className="glass-card p-5 lg:p-6 flex flex-col justify-between min-w-0 relative overflow-hidden"
      style={{ borderTop: `2px solid ${accentBorder}` }}
    >
      {/* Label row */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest text-text-label font-mono flex items-center gap-1.5">
          {label}
          <InfoTip text={tooltip} />
          {source === 'derived' && (
            <span className="bg-status-yellow/10 text-status-yellow/70 text-[8px] px-1 py-0.5 rounded uppercase tracking-wider">
              Est.
            </span>
          )}
        </p>
        <span
          className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
            isUp ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'
          }`}
        >
          {isUp ? '▲' : '▼'} {Math.abs(pctChange).toFixed(1)}%
        </span>
      </div>

      {/* Big number */}
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <span className="text-3xl sm:text-4xl lg:text-5xl font-mono font-bold text-text-primary tabular-nums leading-none">
            {formatValue(animated, unit)}
          </span>
          {unit === '₱/liter' && (
            <span className="text-sm text-text-dim font-mono ml-1">/L</span>
          )}
        </div>

        {/* Wider sparkline */}
        {sparkData.length >= 2 && (
          <div className="shrink-0">
            <SparkChart data={sparkData} color={sparkColor} width={120} height={32} />
          </div>
        )}
      </div>

      {/* Delta detail */}
      <p className={`mt-3 text-xs font-mono ${isUp ? 'text-red-400/80' : 'text-emerald-400/80'}`}>
        {isUp ? '↑' : '↓'} {deltaLabel} vs prev week
      </p>
    </div>
  );
}

function StatusBadge({
  label,
  value,
  color,
  bg,
  subtitle,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
  subtitle: string;
}) {
  return (
    <div className={`glass-card p-4 flex items-center gap-3 ${bg} border-border-subtle`}>
      <div className={`w-3 h-3 rounded-full ${color.replace('text-', 'bg-')} animate-pulse`} />
      <div>
        <p className="text-[9px] uppercase tracking-widest text-text-subtle font-mono">{label}</p>
        <span className={`text-lg font-mono font-bold ${color}`}>{value}</span>
        <p className="text-[10px] text-text-dim font-mono">{subtitle}</p>
      </div>
    </div>
  );
}

interface ExecutiveSnapshotProps {
  scenarioParams: ScenarioParams;
}

export function ExecutiveSnapshot({ scenarioParams }: ExecutiveSnapshotProps) {
  const { prices, priceHistory, isLive } = usePrices();
  const { events } = useEvents();

  const brent = prices.find((p) => p.id === 'brent-crude');
  const forex = prices.find((p) => p.id === 'php-usd');
  const gasoline = prices.find((p) => p.id === 'pump-gasoline');
  const diesel = prices.find((p) => p.id === 'pump-diesel');

  if (!brent || !forex || !gasoline || !diesel) return null;

  const kpis = [
    {
      label: 'Brent Crude',
      benchmark: brent,
      unit: '$/bbl',
      sparkColor: '#3b82f6',
      accentBorder: '#3b82f6',
      deltaLabel: `$${Math.abs(brent.value - brent.previousWeek).toFixed(1)}`,
      source: 'live' as const,
    },
    {
      label: 'PHP / USD',
      benchmark: forex,
      unit: '₱/$',
      sparkColor: '#a855f7',
      accentBorder: '#a855f7',
      deltaLabel: `₱${Math.abs(forex.value - forex.previousWeek).toFixed(2)}`,
      source: 'live' as const,
    },
    {
      label: 'Gasoline',
      benchmark: gasoline,
      unit: '₱/liter',
      sparkColor: '#ef4444',
      accentBorder: '#ef4444',
      deltaLabel: `₱${Math.abs(gasoline.value - gasoline.previousWeek).toFixed(2)}`,
      source: 'derived' as const,
    },
    {
      label: 'Diesel',
      benchmark: diesel,
      unit: '₱/liter',
      sparkColor: '#f59e0b',
      accentBorder: '#f59e0b',
      deltaLabel: `₱${Math.abs(diesel.value - diesel.previousWeek).toFixed(2)}`,
      source: 'derived' as const,
    },
  ];

  const risk = getRiskLevel(scenarioParams);
  const criticalCount = events.filter((e) => e.severity === 'red').length;

  return (
    <section>
      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-3">
        {isLive && (
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400">Live</span>
          </span>
        )}
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Executive Snapshot
        </h2>
      </div>

      {/* Hero KPI grid — 4 big cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {kpis.map(({ label, benchmark, unit, sparkColor, accentBorder, deltaLabel, source }) => (
          <HeroKPI
            key={benchmark.id}
            label={label}
            value={benchmark.value}
            unit={unit}
            delta={benchmark.value - benchmark.previousWeek}
            deltaLabel={deltaLabel}
            sparkData={priceHistory[benchmark.id] ?? [benchmark.value]}
            sparkColor={sparkColor}
            accentBorder={accentBorder}
            tooltip={benchmark.tooltip}
            source={source}
          />
        ))}
      </div>

      {/* Secondary status row */}
      <div className="grid grid-cols-2 gap-3">
        <StatusBadge
          label="Supply Risk"
          value={risk.label}
          color={risk.color}
          bg={risk.bg}
          subtitle="Hormuz + Refinery"
        />
        <StatusBadge
          label="Disruptions"
          value={String(criticalCount)}
          color={criticalCount > 2 ? 'text-red-400' : criticalCount > 0 ? 'text-amber-400' : 'text-emerald-400'}
          bg={criticalCount > 2 ? 'bg-red-400/10' : criticalCount > 0 ? 'bg-amber-400/10' : 'bg-emerald-400/10'}
          subtitle={`of ${events.length} events`}
        />
      </div>
    </section>
  );
}
