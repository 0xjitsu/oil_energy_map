import { VITAL_SIGNS } from '@/lib/constants';
import { Tooltip } from '@/components/ui/Tooltip';
import { RiskLevel } from '@/types';

const STATUS_STYLES: Record<RiskLevel, { badge: string; label: string; pulse: boolean }> = {
  green: { badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', label: 'OK', pulse: false },
  yellow: { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', label: 'WATCH', pulse: true },
  red: { badge: 'bg-red-500/20 text-red-400 border-red-500/30', label: 'ALERT', pulse: true },
};

export function VitalSigns() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {VITAL_SIGNS.map((sign) => {
        const style = STATUS_STYLES[sign.status];
        return (
          <div
            key={sign.label}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.25)] font-sans">
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
              <span className="text-2xl font-mono font-bold text-[rgba(255,255,255,0.9)] cursor-help">
                {sign.value}
              </span>
            </Tooltip>
          </div>
        );
      })}
    </div>
  );
}
