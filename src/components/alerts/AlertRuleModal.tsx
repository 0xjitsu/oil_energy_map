'use client';

import { useState } from 'react';
import { priceBenchmarks } from '@/data/prices';
import type { AlertRule } from '@/types';

interface AlertRuleModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (rule: Omit<AlertRule, 'id' | 'createdAt' | 'enabled'>) => void;
}

export default function AlertRuleModal({ open, onClose, onSave }: AlertRuleModalProps) {
  const [benchmarkId, setBenchmarkId] = useState(priceBenchmarks[0]?.id ?? '');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [threshold, setThreshold] = useState(100);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative glass-card p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-mono text-[10px] uppercase tracking-widest text-text-primary mb-4">
          New Alert Rule
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-1 block">
              Benchmark
            </label>
            <select
              value={benchmarkId}
              onChange={(e) => setBenchmarkId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-border border border-border-hover text-sm font-mono text-text-primary outline-none"
            >
              {priceBenchmarks.map((b) => (
                <option key={b.id} value={b.id} className="bg-bg-card">{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-1 block">
              Direction
            </label>
            <div className="flex gap-2">
              {(['above', 'below'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`flex-1 px-3 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    direction === d ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-border text-text-muted'
                  }`}
                >
                  {d === 'above' ? '↑ Above' : '↓ Below'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[9px] font-mono text-text-dim uppercase tracking-widest mb-1 block">
              Threshold
            </label>
            <input
              type="number"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg bg-border border border-border-hover text-sm font-mono text-text-primary outline-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 px-3 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest bg-border text-text-muted hover:bg-border-subtle">
            Cancel
          </button>
          <button
            onClick={() => onSave({ benchmarkId, direction, threshold })}
            className="flex-1 px-3 py-2 rounded-lg font-mono text-[10px] uppercase tracking-widest bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
          >
            Save Rule
          </button>
        </div>
      </div>
    </div>
  );
}
