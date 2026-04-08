'use client';

import type { useAlerts } from '@/hooks/useAlerts';

interface AlertDrawerProps {
  open: boolean;
  onClose: () => void;
  alerts: ReturnType<typeof useAlerts>;
  onAddRule: () => void;
}

export default function AlertDrawer({ open, onClose, alerts, onAddRule }: AlertDrawerProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div
        className="absolute right-0 top-0 bottom-0 w-full sm:w-[360px] glass-card border-l border-border-subtle overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-card/90 backdrop-blur">
          <h3 className="font-mono text-[10px] uppercase tracking-widest text-text-primary">
            Alerts ({alerts.unreadCount} new)
          </h3>
          <div className="flex items-center gap-2">
            {alerts.unreadCount > 0 && (
              <button
                onClick={alerts.markAllRead}
                className="text-[9px] font-mono text-text-dim hover:text-text-secondary"
              >
                Mark all read
              </button>
            )}
            <button onClick={onAddRule} className="px-2 py-1 rounded text-[9px] font-mono bg-blue-500/20 text-blue-400 hover:bg-blue-500/30">
              + Rule
            </button>
            <button onClick={onClose} className="text-text-dim hover:text-text-secondary">✕</button>
          </div>
        </div>

        {alerts.rules.length > 0 && (
          <div className="px-4 py-3 border-b border-border-subtle">
            <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-2">Active Rules</p>
            {alerts.rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between py-1.5">
                <span className="text-[10px] font-mono text-text-secondary">
                  {rule.benchmarkId} {rule.direction} {rule.threshold}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => alerts.toggleRule(rule.id)}
                    className={`text-[9px] font-mono ${rule.enabled ? 'text-emerald-400' : 'text-text-dim'}`}
                  >
                    {rule.enabled ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => alerts.removeRule(rule.id)}
                    className="text-[9px] text-text-dim hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-3">
          <p className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-2">History</p>
          {alerts.history.length === 0 ? (
            <p className="text-[10px] font-mono text-text-dim py-4 text-center">No alerts yet</p>
          ) : (
            alerts.history.map((n) => (
              <div
                key={n.id}
                onClick={() => alerts.markRead(n.id)}
                className={`py-2 border-b border-border cursor-pointer transition-colors hover:bg-surface-hover ${
                  n.read ? 'opacity-50' : ''
                }`}
              >
                <p className="text-[10px] font-mono text-text-primary">
                  {n.benchmarkName} {n.direction === 'above' ? '↑' : '↓'} {n.threshold}
                </p>
                <p className="text-[9px] font-mono text-text-dim">
                  Value: {n.value} · {new Date(n.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
