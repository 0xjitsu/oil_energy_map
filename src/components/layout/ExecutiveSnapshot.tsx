'use client';

import { usePrices } from '@/hooks/usePrices';
import { useEvents } from '@/hooks/useEvents';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { SparkChart } from '@/components/prices/SparkChart';
import { InfoTip } from '@/components/ui/Tooltip';
import { weeklySeriesFor } from '@/lib/weekly-series';
import { formatPHP, formatUSD } from '@/lib/format';

type RiskTone = 'danger' | 'warning' | 'caution' | 'ok';

const RISK_TONE_CLASS: Record<RiskTone, string> = {
  danger: 'text-status-red',
  warning: 'text-status-red',
  caution: 'text-status-yellow',
  ok: 'text-status-green',
};

const RISK_TONE_BG: Record<RiskTone, string> = {
  danger: 'bg-status-red/10',
  warning: 'bg-status-red/10',
  caution: 'bg-status-yellow/10',
  ok: 'bg-status-green/10',
};

/**
 * Pure: supply-risk from LIVE signals only — Brent week-over-week move and
 * live event severities. Replaces the old scenario-coupled formula so Act 1
 * never presents a hypothetical as current risk (Wave A integrity rule).
 */
export function getLiveSupplyRisk(
  brentValue: number,
  brentPreviousWeek: number,
  redEvents: number,
  yellowEvents: number,
): { label: string; tone: RiskTone } {
  const brentDeltaPct =
    brentPreviousWeek > 0
      ? Math.max(0, (brentValue - brentPreviousWeek) / brentPreviousWeek) * 100
      : 0;
  const score =
    Math.min(1, brentDeltaPct / 20) * 0.4 +
    Math.min(1, redEvents / 3) * 0.4 +
    Math.min(1, yellowEvents / 5) * 0.2;
  if (score > 0.6) return { label: 'CRITICAL', tone: 'danger' };
  if (score > 0.3) return { label: 'HIGH', tone: 'warning' };
  if (score > 0.1) return { label: 'MODERATE', tone: 'caution' };
  return { label: 'LOW', tone: 'ok' };
}

function formatValue(value: number, unit: string): string {
  if (unit === '$/bbl') return formatUSD(value, { decimals: 1 });
  return formatPHP(value);
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
  targetId,
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
  targetId?: string;
}) {
  const animated = useAnimatedNumber(value);
  const isUp = delta > 0;
  const base = value - delta;
  const pctChange = base !== 0 ? (delta / Math.abs(base)) * 100 : 0;

  return (
    <button
      type="button"
      aria-label={`View details for ${label}`}
      className="glass-card p-5 lg:p-6 flex flex-col justify-between min-w-0 relative overflow-hidden cursor-pointer hover:border-border-hover transition-colors duration-200 text-left w-full"
      style={{ borderTop: `2px solid ${accentBorder}` }}
      onClick={() => {
        if (targetId) {
          document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        }
      }}
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
            isUp ? 'text-status-red bg-status-red/10' : 'text-status-green bg-status-green/10'
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
        <div className="shrink-0">
          <SparkChart data={sparkData} color={sparkColor} width={120} height={32} emptyLabel="history building…" />
        </div>
      </div>

      {/* Delta detail */}
      <div className="mt-3 flex items-center justify-between">
        <p className={`text-xs font-mono flex items-center gap-1 ${isUp ? 'text-status-red/80' : 'text-status-green/80'}`}>
          <span
            style={{
              display: 'inline-block',
              transform: `scale(${1 + Math.min(Math.abs(pctChange) / 10, 1.5)})`,
              transition: 'transform 300ms ease-out',
            }}
          >
            {isUp ? '▲' : '▼'}
          </span>
          {deltaLabel} vs prev week
        </p>
        <span className="text-[10px] font-mono text-text-dim">
          prev: {formatValue(base, unit)}
        </span>
      </div>
      <span className="text-[9px] font-mono text-text-dim mt-1">View details ↓</span>
    </button>
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

export function ExecutiveSnapshot() {
  const { prices, priceHistory, isLive } = usePrices();
  const { events } = useEvents();

  const brent = prices.find((p) => p.id === 'brent-crude');
  const forex = prices.find((p) => p.id === 'php-usd');
  const gasoline = prices.find((p) => p.id === 'pump-gasoline');
  const diesel = prices.find((p) => p.id === 'pump-diesel');

  if (!brent || !forex || !gasoline || !diesel) return null;

  // Per-KPI identity colors — each metric card gets a distinct hue so the four
  // cards stay visually distinguishable. Intentionally hardcoded and crisis-invariant:
  // the crisis system recolors --accent-primary and card backgrounds, not per-metric
  // identity hues. Do NOT convert these to status tokens.
  const kpis = [
    {
      label: 'Brent Crude',
      benchmark: brent,
      unit: '$/bbl',
      sparkColor: '#3b82f6',
      accentBorder: '#3b82f6',
      deltaLabel: `$${Math.abs(brent.value - brent.previousWeek).toFixed(1)}`,
      source: 'live' as const,
      targetId: 'prices',
    },
    {
      label: 'PHP / USD',
      benchmark: forex,
      unit: '₱/$',
      sparkColor: '#a855f7',
      accentBorder: '#a855f7',
      deltaLabel: `₱${Math.abs(forex.value - forex.previousWeek).toFixed(2)}`,
      source: 'live' as const,
      targetId: 'prices',
    },
    {
      label: 'Gasoline',
      benchmark: gasoline,
      unit: '₱/liter',
      sparkColor: '#ef4444',
      accentBorder: '#ef4444',
      deltaLabel: `₱${Math.abs(gasoline.value - gasoline.previousWeek).toFixed(2)}`,
      source: 'live' as const,
      targetId: 'tracker',
    },
    {
      label: 'Diesel',
      benchmark: diesel,
      unit: '₱/liter',
      sparkColor: '#f59e0b',
      accentBorder: '#f59e0b',
      deltaLabel: `₱${Math.abs(diesel.value - diesel.previousWeek).toFixed(2)}`,
      source: 'live' as const,
      targetId: 'tracker',
    },
  ];

  const criticalCount = events.filter((e) => e.severity === 'red').length;
  const yellowCount = events.filter((e) => e.severity === 'yellow').length;
  const risk = getLiveSupplyRisk(brent.value, brent.previousWeek, criticalCount, yellowCount);

  return (
    <section>
      {/* Live indicator */}
      <div className="flex items-center gap-2 mb-3">
        {isLive && (
          <span className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-status-green" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-status-green">Live</span>
          </span>
        )}
        {!isLive && (
          <span className="flex items-center gap-1.5">
            <span className="inline-flex h-2 w-2 rounded-full bg-status-yellow" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-status-yellow">Cached</span>
          </span>
        )}
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Executive Snapshot
        </h2>
      </div>

      {/* Hero KPI grid — 4 big cards */}
      <div aria-live="polite" aria-label="Key market indicators" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        {kpis.map(({ label, benchmark, unit, sparkColor, accentBorder, deltaLabel, source, targetId }) => (
          <HeroKPI
            key={benchmark.id}
            label={label}
            value={benchmark.value}
            unit={unit}
            delta={benchmark.value - benchmark.previousWeek}
            deltaLabel={deltaLabel}
            sparkData={weeklySeriesFor(benchmark.id) ?? priceHistory[benchmark.id] ?? []}
            sparkColor={sparkColor}
            accentBorder={accentBorder}
            tooltip={benchmark.tooltip}
            source={source}
            targetId={targetId}
          />
        ))}
      </div>

      {/* Secondary status row */}
      <div className="grid grid-cols-2 gap-3">
        <StatusBadge
          label="Supply Risk"
          value={risk.label}
          color={RISK_TONE_CLASS[risk.tone]}
          bg={RISK_TONE_BG[risk.tone]}
          subtitle="Brent Δ + live events"
        />
        <StatusBadge
          label="Disruptions"
          value={String(criticalCount)}
          color={
            RISK_TONE_CLASS[
              criticalCount > 2 ? 'danger' : criticalCount > 0 ? 'caution' : 'ok'
            ]
          }
          bg={
            RISK_TONE_BG[
              criticalCount > 2 ? 'danger' : criticalCount > 0 ? 'caution' : 'ok'
            ]
          }
          subtitle={`of ${events.length} events`}
        />
      </div>
    </section>
  );
}
