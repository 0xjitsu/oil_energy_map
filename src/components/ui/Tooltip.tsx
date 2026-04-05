'use client';

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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

// ---------------------------------------------------------------------------
// TooltipPortal — renders the tooltip bubble at document.body via a portal,
// positioned with `position: fixed` from getBoundingClientRect so it escapes
// any parent with overflow:hidden or contain:layout.
// ---------------------------------------------------------------------------

const TOOLTIP_WIDTH = 240; // w-60
const VIEWPORT_PADDING = 8;

interface TooltipPortalProps {
  text: string;
  anchorRef: React.RefObject<HTMLElement>;
}

function TooltipPortal({ text, anchorRef }: TooltipPortalProps) {
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' as const });
  // Fix 1: SSR guard — only call createPortal after mount
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fix 2: Recompute position on scroll/resize while tooltip is open
  useEffect(() => {
    const el = anchorRef.current;
    if (!el) return;

    const recompute = () => {
      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth;

      // Fix 4: Vertical viewport clamping — flip below if not enough room above
      const fitsAbove = rect.top > 60; // rough tooltip height estimate
      const top = fitsAbove ? rect.top - 8 : rect.bottom + 8;
      const transform = fitsAbove ? 'translateY(-100%)' : 'translateY(0)';

      // Clamp horizontally within viewport
      let left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      left = Math.max(VIEWPORT_PADDING, Math.min(left, vw - TOOLTIP_WIDTH - VIEWPORT_PADDING));

      setStyle({
        position: 'fixed',
        top,
        left,
        width: TOOLTIP_WIDTH,
        transform,
        zIndex: 9999,
        visibility: 'visible' as const,
      });
    };

    recompute();

    window.addEventListener('scroll', recompute, { capture: true, passive: true });
    window.addEventListener('resize', recompute, { passive: true });
    return () => {
      window.removeEventListener('scroll', recompute, { capture: true });
      window.removeEventListener('resize', recompute);
    };
  }, [anchorRef]);

  if (!mounted) return null;

  return createPortal(
    <span
      role="tooltip"
      style={style}
      className="rounded-lg border border-border-hover bg-bg-card px-3 py-2 text-[11px] font-sans leading-relaxed text-text-body shadow-xl pointer-events-none"
    >
      {text}
    </span>,
    document.body
  );
}

// ---------------------------------------------------------------------------
// InfoTip — small info icon with portal tooltip and mobile tap-to-toggle
// ---------------------------------------------------------------------------

/**
 * A small info icon that shows a tooltip on hover.
 * Renders the tooltip via a React portal so it is never clipped by
 * parent containers that have overflow:hidden or contain:layout.
 * On touch devices, tap to toggle; tap elsewhere to close.
 */
export function InfoTip({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(true);
  }, []);

  const hide = useCallback(() => {
    timeoutRef.current = setTimeout(() => setVisible(false), 200);
  }, []);

  // Fix 3: Only toggle on touch — desktop uses hover (avoids click fighting hover state)
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      e.preventDefault();
      setVisible((v) => !v);
    }
  }, []);

  // Close when tapping anywhere outside on touch devices
  useEffect(() => {
    if (!visible) return;

    const handleOutsidePointerDown = (e: PointerEvent) => {
      if (triggerRef.current && triggerRef.current.contains(e.target as Node)) return;
      setVisible(false);
    };

    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
    };
  }, [visible]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <span
      ref={triggerRef}
      className="relative inline-flex items-center"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onPointerDown={handlePointerDown}
      tabIndex={0}
      role="button"
      aria-label="More info"
      aria-expanded={visible}
    >
      <Info className="w-3 h-3 text-text-dim hover:text-text-subtle transition-colors cursor-help" />
      {visible && <TooltipPortal text={text} anchorRef={triggerRef} />}
    </span>
  );
}
