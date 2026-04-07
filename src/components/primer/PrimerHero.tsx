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
      className={`text-center min-h-[70vh] flex flex-col justify-center px-4 fade-in-section ${visible ? 'visible' : 'pending'}`}
    >
      <div className="inline-flex items-center gap-2 mb-6 rounded-full border border-border-hover bg-surface-hover px-4 py-1.5">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
          Oil Primer
        </span>
      </div>

      {/* Animated pipeline icon */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <div className="w-16 h-px bg-gradient-to-r from-transparent to-petron" />
        <div className="w-10 h-10 rounded-xl bg-petron/10 border border-petron/20 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-petron">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="10" r="3" fill="currentColor" className="animate-pulse" />
          </svg>
        </div>
        <div className="w-16 h-px bg-gradient-to-l from-transparent to-petron" />
      </div>

      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        How Energy Reaches You
      </h1>

      <p className="max-w-2xl mx-auto text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
        From oil fields in the Middle East to the gas station down your street —
        trace every step of the supply chain that powers the Philippines, and
        understand why pump prices move the way they do.
      </p>

      <div className="mt-8 flex items-center justify-center gap-8">
        {[
          { value: '7', label: 'Stages' },
          { value: '10,469', label: 'Stations' },
          { value: '₱130.75', label: 'Diesel/L' },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div className="text-xl sm:text-2xl font-mono font-bold text-text-primary tabular-nums">
              {stat.value}
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-text-muted mt-1">
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Scroll CTA */}
      <div className="mt-12 flex flex-col items-center gap-2">
        <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
          Scroll to explore
        </span>
        <svg
          className="w-5 h-5 text-text-muted animate-bounce"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </section>
  );
}
