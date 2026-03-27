'use client';

import { useEffect, useRef, useState } from 'react';

export function PrimerHero() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if already in viewport on mount
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight) {
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
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={`text-center py-16 px-4 fade-in-section ${visible ? 'visible' : 'pending'}`}
    >
      <div className="inline-flex items-center gap-2 mb-6 rounded-full border border-border-hover bg-surface-hover px-4 py-1.5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
          Oil Primer
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        How Energy Reaches You
      </h1>

      <p className="max-w-2xl mx-auto text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
        From oil fields in the Middle East to the gas station down your street —
        trace every step of the supply chain that powers the Philippines, and
        understand why pump prices move the way they do.
      </p>

      <div className="mt-8 flex items-center justify-center gap-6 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
        <span>7 stages</span>
        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
        <span>3 crude benchmarks</span>
        <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
        <span>100% PH context</span>
      </div>
    </section>
  );
}
