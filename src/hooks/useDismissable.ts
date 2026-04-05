'use client';

import { useState, useCallback, useEffect } from 'react';

const STORAGE_PREFIX = 'oil-intel-dismissed-';

export function useDismissable(key: string) {
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Sync from localStorage after mount (SSR-safe)
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_PREFIX + key) === '1') setDismissed(true);
    } catch { /* noop */ }
    setLoaded(true);
  }, [key]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try { localStorage.setItem(STORAGE_PREFIX + key, '1'); }
    catch { /* quota exceeded — still dismissed in session */ }
  }, [key]);

  const reset = useCallback(() => {
    setDismissed(false);
    try { localStorage.removeItem(STORAGE_PREFIX + key); }
    catch { /* noop */ }
  }, [key]);

  return { dismissed, dismiss, reset, loaded };
}
