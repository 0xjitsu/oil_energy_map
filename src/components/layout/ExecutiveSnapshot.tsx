'use client';

import { usePrices } from '@/hooks/usePrices';
import { useEvents } from '@/hooks/useEvents';
import { useAnimatedNumber } from '@/hooks/useAnimatedNumber';
import { SparkChart } from '@/components/prices/SparkChart';
import type { ScenarioParams } from '@/types';

function getRiskLevel(params: ScenarioParams): { label: string; color: string } {
  const score =
    params.hormuzWeeks / 16 +
    (params.refineryOffline ? 0.3 : 0) +
    (params.brentPrice - 106) / 150;
  if (score > 0.6) return { label: 'CRITICAL', color: 'text-red-400' };
  if (score > 0.3) return { label: 'HIGH', color: 'text-amber-400' };
  if (score > 0.1) return { label: 'MODERATE', color: 'text-yellow-400' };
  return { label: 'LOW', color: 'text-emerald-400' };
}

function formatValue(value: number, unit: string): string {
  if (unit === '$/bbl') return `$${value.toFixed(1)}`;
  if (unit === '₱/$') return `₱${value.toFixed(2)}`;
  return `₱${value.toFixed(2)}`;
}

function KPICard({
  label,
  value,
  unit,
  delta,
  deltaLabel,
  sparkData,
  sparkColor,
}: {
  label: string;
  value: number;
  unit: string;
  delta: number;
  deltaLabel: string;
  sparkData: number[];
  sparkColor: string;
}) {
  const animated = useAnimatedNumber(value);
  const isUp = delta > 0;
  const base = value - delta;
  const pctChange = base !== 0 ? (delta / Math.abs(base)) * 100 : 0;

  return (
    <div className="glass-card p-4 flex flex-col justify-between min-w-0">
      <p className="text-[9px] uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1 truncate">
        {label}
      </p>
      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <span className="text-2xl lg:text-3xl font-mono font-bold text-[rgba(255,255,255,0.9)] tabular-nums">
            {formatValue(animated, unit)}
          </span>
          {unit === '₱/liter' && (
            <span className="text-xs text-[rgba(255,255,255,0.2)] font-mono ml-0.5">/L</span>
          )}
        </div>
        {sparkData.length >= 2 && (
          <SparkChart data={sparkData} color={sparkColor} width={64} height={24} />
        )}
      </div>
      <p className={`mt-1.5 text-[11px] font-mono ${isUp ? 'text-red-400' : 'text-emerald-400'}`}>
        {isUp ? '▲' : '▼'} {deltaLabel} ({Math.abs(pctChange).toFixed(1)}%)
      </p>
    </div>
  );
}

function RiskBadge({ params }: { params: ScenarioParams }) {
  const { label, color } = getRiskLevel(params);
  return (
    <div className="glass-card p-4 flex flex-col justify-between">
      <p className="text-[9px] uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1">
        Supply Risk
      </p>
      <span className={`text-2xl lg:text-3xl font-mono font-bold ${color}`}>{label}</span>
      <p className="mt-1.5 text-[11px] font-mono text-[rgba(255,255,255,0.2)]">
        Hormuz + Refinery
      </p>
    </div>
  );
}

function DisruptionCount() {
  const { events } = useEvents();
  const critical = events.filter((e) => e.severity === 'red').length;
  return (
    <div className="glass-card p-4 flex flex-col justify-between">
      <p className="text-[9px] uppercase tracking-widest text-[rgba(255,255,255,0.3)] mb-1">
        Disruptions
      </p>
      <span
        className={`text-2xl lg:text-3xl font-mono font-bold ${
          critical > 2 ? 'text-red-400' : critical > 0 ? 'text-amber-400' : 'text-emerald-400'
        }`}
      >
        {critical}
      </span>
      <p className="mt-1.5 text-[11px] font-mono text-[rgba(255,255,255,0.2)]">
        of {events.length} events
      </p>
    </div>
  );
}

interface ExecutiveSnapshotProps {
  scenarioParams: ScenarioParams;
}

export function ExecutiveSnapshot({ scenarioParams }: ExecutiveSnapshotProps) {
  const { prices, priceHistory } = usePrices();

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
      deltaLabel: `$${Math.abs(brent.value - brent.previousWeek).toFixed(1)}`,
    },
    {
      label: 'PHP/USD',
      benchmark: forex,
      unit: '₱/$',
      sparkColor: '#a855f7',
      deltaLabel: `₱${Math.abs(forex.value - forex.previousWeek).toFixed(2)}`,
    },
    {
      label: 'Gasoline',
      benchmark: gasoline,
      unit: '₱/liter',
      sparkColor: '#ef4444',
      deltaLabel: `₱${Math.abs(gasoline.value - gasoline.previousWeek).toFixed(2)}`,
    },
    {
      label: 'Diesel',
      benchmark: diesel,
      unit: '₱/liter',
      sparkColor: '#f59e0b',
      deltaLabel: `₱${Math.abs(diesel.value - diesel.previousWeek).toFixed(2)}`,
    },
  ];

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {kpis.map(({ label, benchmark, unit, sparkColor, deltaLabel }) => (
        <KPICard
          key={benchmark.id}
          label={label}
          value={benchmark.value}
          unit={unit}
          delta={benchmark.value - benchmark.previousWeek}
          deltaLabel={deltaLabel}
          sparkData={priceHistory[benchmark.id] ?? [benchmark.value]}
          sparkColor={sparkColor}
        />
      ))}
      <RiskBadge params={scenarioParams} />
      <DisruptionCount />
    </section>
  );
}
