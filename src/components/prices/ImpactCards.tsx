import { IMPACT_ITEMS } from '@/lib/constants';
import { Tooltip } from '@/components/ui/Tooltip';

export function ImpactCards() {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {IMPACT_ITEMS.map((item) => (
          <Tooltip key={item.label} text={item.tooltip}>
            <div className="glass-card card-interactive p-4 cursor-default border-l-2 border-l-red-500/40">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg" role="img" aria-label={item.label}>
                  {item.icon}
                </span>
                <span className="text-xs font-sans text-[rgba(255,255,255,0.5)]">
                  {item.label}
                </span>
              </div>
              <p className="text-sm font-mono font-semibold text-red-400">{item.change}</p>
              <p className="text-[10px] font-mono text-[rgba(255,255,255,0.3)] mt-1">
                from {item.current}
              </p>
            </div>
          </Tooltip>
        ))}
      </div>
    </div>
  );
}
