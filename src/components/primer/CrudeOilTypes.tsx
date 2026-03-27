'use client';

import { useEffect, useRef, useState } from 'react';
import { crudeOilTypes, oilProperties } from '@/data/primer';

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

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
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

export function CrudeOilTypes() {
  const benchmarks = useFadeIn();
  const properties = useFadeIn();

  return (
    <section className="max-w-2xl mx-auto mt-16">
      {/* Benchmarks */}
      <div
        ref={benchmarks.ref}
        className={`fade-in-section ${benchmarks.visible ? 'visible' : 'pending'}`}
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-shell)]" />
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
            Crude Oil Benchmarks
          </h2>
        </div>

        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Global oil prices are set by three key benchmarks. Understanding which one matters
          for the Philippines explains why our pump prices sometimes move differently from
          what you see in US-centric news.
        </p>

        <div className="space-y-3">
          {crudeOilTypes.map((crude) => (
            <div
              key={crude.id}
              className={`glass-card p-4 sm:p-5 ${
                crude.highlight
                  ? 'border-[rgba(252,209,22,0.2)] bg-[rgba(252,209,22,0.03)]'
                  : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {crude.name}
                    </h3>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] px-2 py-0.5 rounded border border-[rgba(255,255,255,0.06)]">
                      {crude.subtitle}
                    </span>
                    {crude.highlight && (
                      <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--ph-yellow)] px-2 py-0.5 rounded bg-[rgba(252,209,22,0.1)] border border-[rgba(252,209,22,0.2)]">
                        PH Reference
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-2">
                    {crude.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Light/Heavy, Sweet/Sour */}
      <div
        ref={properties.ref}
        className={`mt-10 fade-in-section ${properties.visible ? 'visible' : 'pending'}`}
      >
        <div className="flex items-center gap-2 mb-6">
          <div className="w-2 h-2 rounded-full bg-[var(--accent-chevron)]" />
          <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
            Crude Oil Properties
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {oilProperties.map((prop) => (
            <div key={prop.id} className="glass-card p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                {prop.title}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {prop.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
