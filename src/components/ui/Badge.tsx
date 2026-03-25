'use client';

interface BadgeProps {
  status: 'green' | 'yellow' | 'red';
  label?: string;
}

const statusConfig: Record<BadgeProps['status'], { classes: string; defaultLabel: string }> = {
  green: {
    classes: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    defaultLabel: 'NORMAL',
  },
  yellow: {
    classes: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    defaultLabel: 'WARNING',
  },
  red: {
    classes: 'bg-red-500/10 text-red-400 border border-red-500/20',
    defaultLabel: 'CRITICAL',
  },
};

export default function Badge({ status, label }: BadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[8px] uppercase tracking-widest font-mono font-semibold ${config.classes}`}
    >
      {label ?? config.defaultLabel}
    </span>
  );
}
