'use client';

import { useState } from 'react';
import type { ScenarioParams, SavedScenario } from '@/types';

interface ScenarioSlotsProps {
  scenarios: SavedScenario[];
  onLoad: (params: ScenarioParams) => void;
  onRemove: (id: string) => void;
  onSave: (name: string) => void;
  disabled?: boolean;
}

export function ScenarioSlots({ scenarios, onLoad, onRemove, onSave, disabled }: ScenarioSlotsProps) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim());
      setName('');
      setNaming(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {scenarios.map((s) => (
        <button
          key={s.id}
          className="group flex items-center gap-1.5 px-2.5 py-1 rounded-full glass-card text-[10px] font-mono text-text-secondary hover:text-text-primary transition-colors"
          onClick={() => onLoad(s.params)}
        >
          {s.name}
          <span
            onClick={(e) => { e.stopPropagation(); onRemove(s.id); }}
            className="text-text-dim hover:text-red-400 cursor-pointer"
          >
            ✕
          </span>
        </button>
      ))}

      {!disabled && scenarios.length < 5 && !naming && (
        <button
          onClick={() => setNaming(true)}
          className="px-2.5 py-1 rounded-full border border-dashed border-border-hover text-[10px] font-mono text-text-dim hover:text-text-secondary hover:border-border transition-colors"
        >
          + Save Current
        </button>
      )}

      {naming && (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Scenario name"
            className="px-2 py-1 rounded-md bg-border text-[10px] font-mono text-text-primary outline-none w-32"
            autoFocus
          />
          <button onClick={handleSave} className="text-[10px] text-emerald-400">✓</button>
          <button onClick={() => setNaming(false)} className="text-[10px] text-text-dim">✕</button>
        </div>
      )}
    </div>
  );
}
