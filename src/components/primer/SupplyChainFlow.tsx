'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supplyChainStages } from '@/data/primer';

function StageCard({
  stage,
  isOpen,
  onToggle,
}: {
  stage: (typeof supplyChainStages)[number];
  isOpen: boolean;
  onToggle: () => void;
}) {
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

  return (
    <div
      ref={ref}
      className={`fade-in-section ${visible ? 'visible' : 'pending'}`}
      style={{ transitionDelay: `${stage.number * 80}ms` }}
    >
      {/* Connector line */}
      {stage.number > 1 && (
        <div className="flex justify-center py-2">
          <div className="w-px h-8 bg-gradient-to-b from-border-hover to-surface-hover" />
        </div>
      )}

      <button
        onClick={onToggle}
        className="w-full text-left glass-card card-interactive p-4 sm:p-5 cursor-pointer group"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-4">
          {/* Stage number + icon */}
          <div
            className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-xl"
            style={{
              background: `color-mix(in srgb, ${stage.color} 15%, transparent)`,
              border: `1px solid color-mix(in srgb, ${stage.color} 25%, transparent)`,
            }}
          >
            {stage.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="text-[10px] font-mono tracking-widest uppercase"
                style={{ color: stage.color }}
              >
                Stage {stage.number}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-semibold text-[var(--text-primary)] mt-0.5">
              {stage.title}
            </h3>
          </div>

          {/* Expand indicator */}
          <div
            className="flex-shrink-0 w-6 h-6 rounded-full border border-border-hover flex items-center justify-center transition-transform duration-300"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              className="text-[var(--text-muted)]"
            >
              <path
                d="M2 3.5L5 6.5L8 3.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* CSS accordion using grid-template-rows */}
        <div
          className="grid transition-[grid-template-rows] duration-400 ease-in-out"
          style={{
            gridTemplateRows: isOpen ? '1fr' : '0fr',
          }}
        >
          <div className="overflow-hidden">
            <div className="pt-4 space-y-4">
              {/* What happens here */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
                  What happens here
                </p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {stage.what}
                </p>
              </div>

              {/* PH Context */}
              <div
                className="rounded-lg p-3"
                style={{
                  background: 'rgba(0, 56, 168, 0.08)',
                  border: '1px solid rgba(0, 56, 168, 0.15)',
                }}
              >
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--ph-blue)] mb-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--ph-blue)]" />
                  Philippine Context
                </p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {stage.phContext}
                </p>
              </div>

              {/* Key Players */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">
                  Key Players
                </p>
                <div className="flex flex-wrap gap-2">
                  {stage.keyPlayers.map((player) => (
                    <span
                      key={player}
                      className="inline-block text-xs font-mono px-2.5 py-1 rounded-md bg-border border border-border-subtle text-[var(--text-secondary)]"
                    >
                      {player}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </button>
    </div>
  );
}

export function SupplyChainFlow() {
  const [openStages, setOpenStages] = useState<Set<string>>(new Set());

  const toggleStage = useCallback((id: string) => {
    setOpenStages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  return (
    <section className="max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-2 h-2 rounded-full bg-[var(--accent-petron)]" />
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
          Supply Chain Flow
        </h2>
      </div>

      <div>
        {supplyChainStages.map((stage) => (
          <StageCard
            key={stage.id}
            stage={stage}
            isOpen={openStages.has(stage.id)}
            onToggle={() => toggleStage(stage.id)}
          />
        ))}
      </div>
    </section>
  );
}
