'use client';

import { createContext, useContext, useEffect, useMemo } from 'react';
import { useEvents } from '@/hooks/useEvents';
import { usePrices } from '@/hooks/usePrices';
import type { ScenarioParams } from '@/types';
import {
  type CrisisLevel,
  computeCrisisScore,
  getCrisisLevel,
  getCrisisTokens,
} from '@/lib/crisisLevel';

interface CrisisContextValue {
  crisisLevel: CrisisLevel;
  crisisScore: number;
}

const CrisisContext = createContext<CrisisContextValue>({
  crisisLevel: 'CALM',
  crisisScore: 0,
});

export function useCrisis() {
  return useContext(CrisisContext);
}

const TOKEN_KEYS = [
  '--accent-primary',
  '--bg-card-crisis',
  '--border-crisis',
  '--scan-line-opacity',
] as const;

export function CrisisProvider({
  children,
  scenarioParams,
}: {
  children: React.ReactNode;
  scenarioParams: ScenarioParams;
}) {
  const { events } = useEvents();
  const { prices } = usePrices();

  const brentPreviousWeek = useMemo(() => {
    const brent = prices.find((p) => p.id === 'brent-crude');
    return brent?.previousWeek ?? 0;
  }, [prices]);

  const crisisScore = useMemo(
    () => computeCrisisScore(events, scenarioParams, brentPreviousWeek),
    [events, scenarioParams, brentPreviousWeek],
  );

  const crisisLevel = useMemo(() => getCrisisLevel(crisisScore), [crisisScore]);

  // Apply CSS custom property overrides on document root
  useEffect(() => {
    const root = document.documentElement;
    const tokens = getCrisisTokens(crisisLevel);

    for (const key of TOKEN_KEYS) {
      root.style.setProperty(key, tokens[key]);
    }
    root.dataset.crisisLevel = crisisLevel.toLowerCase();

    return () => {
      for (const key of TOKEN_KEYS) {
        root.style.removeProperty(key);
      }
      delete root.dataset.crisisLevel;
    };
  }, [crisisLevel]);

  const value = useMemo(
    () => ({ crisisLevel, crisisScore }),
    [crisisLevel, crisisScore],
  );

  return (
    <CrisisContext.Provider value={value}>{children}</CrisisContext.Provider>
  );
}
