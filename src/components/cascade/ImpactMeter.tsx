import type { SeverityLevel } from '@/types/cascade';
import { SEVERITY_COLORS } from '@/data/cascade';

const SEVERITY_WIDTH: Record<SeverityLevel, string> = {
  low: 'w-1/4',
  moderate: 'w-1/2',
  high: 'w-3/4',
  critical: 'w-full',
};

interface ImpactMeterProps {
  severity: SeverityLevel;
}

export function ImpactMeter({ severity }: ImpactMeterProps) {
  const color = SEVERITY_COLORS[severity];
  const widthClass = SEVERITY_WIDTH[severity];

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-border-subtle overflow-hidden">
        <div
          className={`h-full rounded-full ${widthClass} transition-all duration-500`}
          style={{ backgroundColor: color }}
        />
      </div>
      <span
        className="font-mono text-[10px] uppercase tracking-widest"
        style={{ color }}
      >
        {severity}
      </span>
    </div>
  );
}
