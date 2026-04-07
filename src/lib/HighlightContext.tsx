'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface HighlightState {
  highlightedPlayer: string | null;
  setHighlightedPlayer: (player: string | null) => void;
}

const HighlightContext = createContext<HighlightState>({
  highlightedPlayer: null,
  setHighlightedPlayer: () => {},
});

export function HighlightProvider({ children }: { children: ReactNode }) {
  const [highlightedPlayer, setHighlightedPlayerRaw] = useState<string | null>(null);
  const setHighlightedPlayer = useCallback((player: string | null) => {
    setHighlightedPlayerRaw(player);
  }, []);

  return (
    <HighlightContext.Provider value={{ highlightedPlayer, setHighlightedPlayer }}>
      {children}
    </HighlightContext.Provider>
  );
}

export function useHighlight() {
  return useContext(HighlightContext);
}
