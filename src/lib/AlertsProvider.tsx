'use client';

import { createContext, useContext, useEffect } from 'react';
import { useAlerts } from '@/hooks/useAlerts';
import { usePrices } from '@/hooks/usePrices';

type AlertsStore = ReturnType<typeof useAlerts>;

const AlertsContext = createContext<AlertsStore | null>(null);

/**
 * Owns the SINGLE alerts store for the app and wires it to the price feed:
 * every completed poll (including fallback-resolved ones — DataProvider
 * resolves non-ok responses to static prices and still stamps pricesUpdated)
 * is evaluated against the user's alert rules via checkPrices. Before this
 * provider existed, checkPrices had zero call sites and the AlertBell was
 * decorative.
 *
 * Mounted in the root layout INSIDE DataProvider, so usePrices() reads the
 * real polling context.
 */
export function AlertsProvider({ children }: { children: React.ReactNode }) {
  const alerts = useAlerts();
  const { prices, isLive, lastUpdated } = usePrices();
  const { checkPrices } = alerts;

  useEffect(() => {
    if (!isLive || !lastUpdated || prices.length === 0) return;
    checkPrices(prices);
    // checkPrices is a stable useCallback; rule cooldowns (30 min) prevent
    // notification spam across the 5-minute polls.
  }, [lastUpdated, isLive, prices, checkPrices]);

  return <AlertsContext.Provider value={alerts}>{children}</AlertsContext.Provider>;
}

export function useAlertsContext(): AlertsStore {
  const ctx = useContext(AlertsContext);
  if (!ctx) throw new Error('useAlertsContext must be used within AlertsProvider');
  return ctx;
}
