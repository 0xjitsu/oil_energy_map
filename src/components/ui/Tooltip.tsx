'use client';

import { useState, useRef, useCallback, type ReactNode } from 'react';
import { Info } from 'lucide-react';

interface TooltipProps {
  text: string;
  children: ReactNode;
}

export function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(false), 150);
  }, []);

  return (
    <span className="relative inline-block" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 rounded-lg border border-border-hover bg-bg-card px-3 py-2 text-[11px] font-sans leading-relaxed text-text-body shadow-xl pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  );
}

/**
 * A small info icon that shows a tooltip on hover.
 * Use next to labels where supplementary information is available.
 */
export function InfoTip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(false), 200);
  }, []);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={0}
      role="button"
      aria-label="More info"
    >
      <Info className="w-3 h-3 text-text-dim hover:text-text-subtle transition-colors cursor-help" />
      {visible && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-60 rounded-lg border border-border-hover bg-bg-card px-3 py-2 text-[11px] font-sans leading-relaxed text-text-body shadow-xl pointer-events-none"
        >
          {text}
        </span>
      )}
    </span>
  );
}
