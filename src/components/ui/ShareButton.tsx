'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface ShareButtonProps {
  /** The fully-qualified URL to share. */
  url: string;
  /** A short title for the native share sheet. */
  title: string;
  /** Optional descriptive text for the native share sheet. */
  text?: string;
}

/**
 * A lightweight, no-login share affordance. Prefers the native Web Share API
 * (mobile share sheet); falls back to copying the link to the clipboard with a
 * transient "Copied" confirmation. No third-party SDKs.
 */
export function ShareButton({ url, title, text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const flashCopied = useCallback(() => {
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleShare = useCallback(async () => {
    // Native share sheet first (mobile / supporting browsers).
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // User dismissed the sheet, or share failed — fall through to copy.
      }
    }
    // Clipboard fallback.
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      }
      flashCopied();
    } catch {
      // Clipboard blocked (insecure context / permissions) — last resort: prompt.
      if (typeof window !== 'undefined') {
        window.prompt('Copy this link:', url);
      }
    }
  }, [url, title, text, flashCopied]);

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Share this view"
      className="inline-flex items-center gap-1.5 rounded-md border border-border-subtle bg-surface-hover px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-text-secondary transition-colors hover:border-border-hover hover:text-text-primary"
    >
      <span aria-hidden="true">{copied ? '✓' : '↗'}</span>
      {copied ? 'Copied' : 'Share this view'}
    </button>
  );
}
