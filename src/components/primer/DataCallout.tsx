'use client';

import { useEffect, useRef, useState } from 'react';

interface DataCalloutProps {
  value: string;
  label: string;
  source?: string;
  color: string;
  delay?: number;
}

export function DataCallout({ value, label, source, color, delay = 0 }: DataCalloutProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // SSR-safe: check if already in viewport on mount
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      const timer = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(timer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const timer = setTimeout(() => setVisible(true), delay);
          observer.disconnect();
          // Store timer for cleanup
          (el as HTMLElement & { _timer?: ReturnType<typeof setTimeout> })._timer = timer;
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      const timer = (el as HTMLElement & { _timer?: ReturnType<typeof setTimeout> })._timer;
      if (timer) clearTimeout(timer);
    };
  }, [delay]);

  return (
    <div
      ref={ref}
      className="fade-in-section primer-stage"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}
    >
      <div
        className="text-3xl sm:text-4xl font-mono font-bold"
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-sm text-text-secondary mt-1">{label}</div>
      {source && (
        <div className="text-[10px] font-mono text-text-muted mt-0.5">
          {source}
        </div>
      )}
    </div>
  );
}
