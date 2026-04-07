import { VITAL_SIGNS } from '@/lib/constants';
import { InfoTip } from '@/components/ui/Tooltip';
import { GaugeBar, type ThresholdZone } from '@/components/ui/GaugeBar';
import type { RiskLevel, ScenarioParams, MapMode, VitalSign } from '@/types';

const STATUS_STYLES: Record<RiskLevel, { badge: string; label: string; pulse: boolean }> = {
  green: { badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'OK', pulse: false },
  yellow: { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'WATCH', pulse: true },
  red: { badge: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'ALERT', pulse: true },
};

function deriveVitalSigns(base: VitalSign[], params: ScenarioParams): VitalSign[] {
  const disruption = params.hormuzWeeks / 16; // 0 to 1

  return base.map((sign) => {
    switch (sign.label) {
      case 'Days of Supply': {
        const days = Math.round(14 - disruption * 7 - (params.refineryOffline ? 3 : 0));
        const clamped = Math.max(days, 3);
        const status: RiskLevel = clamped >= 12 ? 'green' : clamped >= 8 ? 'yellow' : 'red';
        return { ...sign, value: `${clamped} days`, status };
      }
      case 'Import Diversity': {
        const sources = params.refineryOffline
          ? Math.round(3 - disruption * 1)
          : Math.round(4 - disruption * 2);
        const clamped = Math.max(sources, 1);
        const status: RiskLevel = clamped >= 4 ? 'green' : clamped >= 3 ? 'yellow' : 'red';
        return { ...sign, value: `${clamped} sources`, status };
      }
      case 'Refinery Utilization': {
        if (params.refineryOffline) return { ...sign, value: '0%', status: 'red' as RiskLevel };
        const util = Math.round(92 - disruption * 15);
        const status: RiskLevel = util >= 80 ? 'green' : util >= 60 ? 'yellow' : 'red';
        return { ...sign, value: `${util}%`, status };
      }
      case 'Route Risk': {
        const risk: RiskLevel = disruption >= 0.75 ? 'red' : disruption >= 0.25 ? 'yellow' : 'green';
        const label = risk === 'red' ? 'CRITICAL' : risk === 'yellow' ? 'HIGH' : 'MODERATE';
        return { ...sign, value: label, status: risk };
      }
      default:
        return sign;
    }
  });
}

function getGaugeConfig(sign: VitalSign): { value: number; zones: ThresholdZone[] } {
  switch (sign.label) {
    case 'Days of Supply': {
      // 0-21 day scale
      const days = parseInt(sign.value, 10) || 0;
      const pct = Math.min((days / 21) * 100, 100);
      return {
        value: pct,
        zones: [
          { start: 0, end: 38, color: 'var(--status-red, #ef4444)' },
          { start: 38, end: 57, color: 'var(--status-yellow, #eab308)' },
          { start: 57, end: 100, color: 'var(--status-green, #10b981)' },
        ],
      };
    }
    case 'Import Diversity': {
      // 0-6 sources scale
      const sources = parseInt(sign.value, 10) || 0;
      const pct = Math.min((sources / 6) * 100, 100);
      return {
        value: pct,
        zones: [
          { start: 0, end: 50, color: 'var(--status-red, #ef4444)' },
          { start: 50, end: 67, color: 'var(--status-yellow, #eab308)' },
          { start: 67, end: 100, color: 'var(--status-green, #10b981)' },
        ],
      };
    }
    case 'Refinery Utilization': {
      // Direct percentage
      const util = parseInt(sign.value, 10) || 0;
      return {
        value: util,
        zones: [
          { start: 0, end: 60, color: 'var(--status-red, #ef4444)' },
          { start: 60, end: 80, color: 'var(--status-yellow, #eab308)' },
          { start: 80, end: 100, color: 'var(--status-green, #10b981)' },
        ],
      };
    }
    case 'Route Risk': {
      // Inverted: MODERATE=25, HIGH=60, CRITICAL=90
      const riskMap: Record<string, number> = { MODERATE: 25, HIGH: 60, CRITICAL: 90 };
      const val = riskMap[sign.value] ?? 25;
      return {
        value: val,
        zones: [
          { start: 0, end: 33, color: 'var(--status-green, #10b981)' },
          { start: 33, end: 66, color: 'var(--status-yellow, #eab308)' },
          { start: 66, end: 100, color: 'var(--status-red, #ef4444)' },
        ],
      };
    }
    default:
      return { value: 50, zones: [] };
  }
}

interface VitalSignsProps {
  scenarioParams: ScenarioParams;
  mapMode: MapMode;
}

export function VitalSigns({ scenarioParams, mapMode }: VitalSignsProps) {
  const signs = mapMode === 'live' ? VITAL_SIGNS : deriveVitalSigns(VITAL_SIGNS, scenarioParams);

  return (
    <div className="grid grid-cols-2 gap-3">
      {signs.map((sign) => {
        const style = STATUS_STYLES[sign.status];
        return (
          <div
            key={sign.label}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-sans flex items-center gap-1.5">
                {sign.label}
                <InfoTip text={sign.tooltip} />
              </p>
              <span
                className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[9px] font-mono tracking-wider ${style.badge}`}
              >
                {style.pulse && (
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
                  </span>
                )}
                {style.label}
              </span>
            </div>
            <span className="text-2xl font-mono font-bold text-text-primary">
              {sign.value}
            </span>
            <div className="flex items-center gap-2 mt-3">
              <GaugeBar
                value={getGaugeConfig(sign).value}
                zones={getGaugeConfig(sign).zones}
                height={6}
                className="flex-1"
              />
              <span className="text-[10px] font-mono text-text-subtle whitespace-nowrap">
                {sign.value}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
