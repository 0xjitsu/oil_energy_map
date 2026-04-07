'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AnimatedCounterProps {
  end: number;
  duration?: number;   // ms
  prefix?: string;     // e.g. "₱", "$"
  suffix?: string;     // e.g. "/L", "%", "+"
  decimals?: number;
  color: string;
  label: string;
  source?: string;
}

export function AnimatedCounter({
  end,
  duration = 1500,
  prefix = '',
  suffix = '',
  decimals = 0,
  color,
  label,
  source,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  const animate = useCallback(() => {
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * end);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [end, duration]);

  useEffect(() => {
    const el = ref.current;
    if (!el || started) return;

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      setStarted(true);
      animate();
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [animate, started]);

  const formatted = decimals > 0 ? count.toFixed(decimals) : Math.round(count).toLocaleString();

  return (
    <div ref={ref} className="primer-stage">
      <div
        className="text-3xl sm:text-4xl font-mono font-bold tabular-nums"
        style={{ color }}
      >
        {prefix}{formatted}{suffix}
      </div>
      <div className="text-sm text-text-secondary mt-1">{label}</div>
      {source && (
        <div className="text-[10px] font-mono text-text-muted mt-0.5">{source}</div>
      )}
    </div>
  );
}
