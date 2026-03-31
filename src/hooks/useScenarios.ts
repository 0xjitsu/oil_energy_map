'use client';

import { useState, useCallback } from 'react';
import type { SavedScenario, ScenarioParams } from '@/types';
import { calculatePumpPrice } from '@/lib/scenario-engine';

const STORAGE_KEY = 'oil-intel-scenarios';
const MAX_SCENARIOS = 5;

function loadScenarios(): SavedScenario[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch { return []; }
}

function persist(scenarios: SavedScenario[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scenarios));
}

export function useScenarios() {
  const [scenarios, setScenarios] = useState<SavedScenario[]>(loadScenarios);

  const saveScenario = useCallback((name: string, params: ScenarioParams) => {
    setScenarios((prev) => {
      if (prev.length >= MAX_SCENARIOS) return prev;
      const result = calculatePumpPrice(params);
      const scenario: SavedScenario = {
        id: crypto.randomUUID(),
        name,
        params,
        derived: { gasoline: result.gasoline, diesel: result.diesel, riskLevel: result.riskLevel },
        savedAt: new Date().toISOString(),
      };
      const updated = [...prev, scenario];
      persist(updated);
      return updated;
    });
  }, []);

  const removeScenario = useCallback((id: string) => {
    setScenarios((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      persist(updated);
      return updated;
    });
  }, []);

  return { scenarios, saveScenario, removeScenario };
}
