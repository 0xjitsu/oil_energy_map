// src/components/services/Pipeline.tsx
'use client';

import { pipelineStages } from '@/data/services';
import { FadeIn } from '@/components/ui/FadeIn';

export function Pipeline() {
  return (
    <section id="pipeline" className="py-20 px-4 max-w-5xl mx-auto">
      <FadeIn>
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-label text-center mb-4">
          TECHNICAL ARCHITECTURE
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-4">
          From scanned PDF to bid-ready dataset
          <br />
          <span className="text-blue-400">in 7 stages.</span>
        </h2>
        <p className="text-text-body text-center max-w-2xl mx-auto mb-12">
          Every bill passes the same deterministic pipeline — no human encoding, no format-specific exceptions.
        </p>

        {/* Horizontal stepper — scrollable on mobile */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex items-start min-w-max">
            {pipelineStages.map((stage, i) => (
              <div key={stage.num} className="flex items-start">
                {/* Stage node */}
                <div className="group flex flex-col items-center w-28 px-2">
                  <div className="w-10 h-10 rounded-full glass-card border border-border-hover flex items-center justify-center font-mono text-sm font-bold text-text-primary group-hover:border-blue-400 group-hover:text-blue-400 transition-colors mb-3 flex-shrink-0">
                    {stage.num}
                  </div>
                  <div className="font-mono text-xs font-bold text-text-primary text-center mb-1">
                    {stage.name}
                  </div>
                  <div className="font-mono text-[9px] text-text-dim text-center leading-snug">
                    {stage.desc}
                  </div>
                </div>
                {/* Connector arrow */}
                {i < pipelineStages.length - 1 && (
                  <div className="flex items-center mt-4 flex-shrink-0">
                    <div className="w-6 h-px bg-border-hover" />
                    <span className="text-text-dim text-xs">›</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
