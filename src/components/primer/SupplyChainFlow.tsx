'use client';

import { useState, useCallback } from 'react';
import { supplyChainStages } from '@/data/primer';
import { TimelineProgress } from './TimelineProgress';
import { StageSection } from './StageSection';

export function SupplyChainFlow() {
  const [activeStage, setActiveStage] = useState(1);

  const handleInView = useCallback((stageNumber: number) => {
    setActiveStage(stageNumber);
  }, []);

  return (
    <section>
      <div className="flex items-center gap-2 mb-6 max-w-4xl mx-auto">
        <div className="w-2 h-2 rounded-full bg-[var(--accent-petron)]" />
        <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
          Supply Chain Flow
        </h2>
      </div>

      <TimelineProgress activeStage={activeStage} />

      <div className="lg:pl-16 xl:pl-48">
        {supplyChainStages.map((stage) => (
          <StageSection
            key={stage.id}
            stage={stage}
            onInView={handleInView}
          />
        ))}
      </div>
    </section>
  );
}
