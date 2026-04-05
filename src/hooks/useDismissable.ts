'use client';

import { useState, useCallback } from 'react';

const STORAGE_PREFIX = 'oil-intel-dismissed-';

export function useDismissable(key: string) {
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem(STORAGE_PREFIX + key) === '1'; }
    catch { return false; }
  });

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

  return { dismissed, dismiss, reset };
}
