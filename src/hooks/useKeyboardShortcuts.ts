'use client';

import { useEffect, useCallback } from 'react';

export interface ShortcutMap {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  enabled: boolean = true,
) {
  const handler = useCallback(
    (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      // ⌘K / Ctrl+K is special — always handle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        shortcuts['⌘K']?.();
        return;
      }

      // Single-key shortcuts (only when no modifier)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toUpperCase();
      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    },
    [shortcuts],
  );

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handler, enabled]);
}
