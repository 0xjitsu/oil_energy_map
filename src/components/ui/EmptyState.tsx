'use client';

import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  message: string;
  timestamp?: string;
  minH?: string;
}

export function EmptyState({ icon, message, timestamp, minH = '120px' }: EmptyStateProps) {
  return (
    <div
      className="glass-card flex flex-col items-center justify-center text-center p-6"
      style={{ minHeight: minH }}
    >
      {icon && (
        <div className="mb-3 text-text-dim text-2xl" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="text-sm font-sans text-text-subtle">{message}</p>
      {timestamp && (
        <p className="text-[10px] font-mono text-text-dim mt-2">{timestamp}</p>
      )}
    </div>
  );
}
