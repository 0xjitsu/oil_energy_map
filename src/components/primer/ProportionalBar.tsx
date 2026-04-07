'use client';

import { useEffect, useRef, useState } from 'react';

interface ProportionalBarProps {
  value: number;      // 0-100 percentage
  label: string;
  color: string;
  suffix?: string;    // e.g. "%"
}

export function ProportionalBar({ value, label, color, suffix = '%' }: ProportionalBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="primer-stage space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-text-secondary">{label}</span>
        <span className="text-sm font-mono font-bold" style={{ color }}>
          {value}{suffix}
        </span>
      </div>
      <div className="h-2 bg-surface-hover rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: visible ? `${value}%` : '0%',
            backgroundColor: color,
            opacity: 0.8,
          }}
        />
      </div>
    </div>
  );
}
