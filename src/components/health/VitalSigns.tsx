import { VITAL_SIGNS } from '@/lib/constants';
import { Tooltip } from '@/components/ui/Tooltip';
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
              <p className="text-[10px] uppercase tracking-widest text-text-muted font-sans">
                {sign.label}
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
            <Tooltip text={sign.tooltip}>
              <span className="text-2xl font-mono font-bold text-text-primary cursor-help">
                {sign.value}
              </span>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
}
