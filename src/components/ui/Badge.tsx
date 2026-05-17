'use client';

interface BadgeProps {
  status: 'green' | 'yellow' | 'red';
  label?: string;
}

const statusConfig: Record<BadgeProps['status'], { classes: string; defaultLabel: string }> = {
  green: {
    classes: 'bg-status-green/10 text-status-green border border-status-green/20',
    defaultLabel: 'NORMAL',
  },
  yellow: {
    classes: 'bg-status-yellow/10 text-status-yellow border border-status-yellow/20',
    defaultLabel: 'WARNING',
  },
  red: {
    classes: 'bg-status-red/10 text-status-red border border-status-red/20',
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
