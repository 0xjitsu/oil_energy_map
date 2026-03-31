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

export function useScenarios() {
  const [scenarios, setScenarios] = useState<SavedScenario[]>(loadScenarios);

  const save = useCallback((updated: SavedScenario[]) => {
    setScenarios(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const saveScenario = useCallback((name: string, params: ScenarioParams) => {
    if (scenarios.length >= MAX_SCENARIOS) return;
    const result = calculatePumpPrice(params);
    const scenario: SavedScenario = {
      id: crypto.randomUUID(),
      name,
      params,
      derived: { gasoline: result.gasoline, diesel: result.diesel, riskLevel: result.riskLevel },
      savedAt: new Date().toISOString(),
    };
    save([...scenarios, scenario]);
  }, [scenarios, save]);

  const removeScenario = useCallback((id: string) => {
    save(scenarios.filter((s) => s.id !== id));
  }, [scenarios, save]);

  return { scenarios, saveScenario, removeScenario };
}
