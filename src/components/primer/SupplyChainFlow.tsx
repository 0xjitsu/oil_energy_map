'use client';

import { useState, useCallback } from 'react';
import { supplyChainStages, type SupplyChainStage } from '@/data/primer';
import { TimelineProgress } from './TimelineProgress';
import { PipelineConnector } from './PipelineConnector';
import { StageHeroBleed } from './StageHeroBleed';
import { StageSplitNarrative } from './StageSplitNarrative';
import { StageStackedCards } from './StageStackedCards';
import { StageBigNumber } from './StageBigNumber';

function StageRouter({
  stage,
  onInView,
}: {
  stage: SupplyChainStage;
  onInView: (stageNumber: number) => void;
}) {
  switch (stage.layoutTemplate) {
    case 'hero-bleed':
      return <StageHeroBleed stage={stage} onInView={onInView} />;
    case 'split-narrative':
      return <StageSplitNarrative stage={stage} onInView={onInView} />;
    case 'stacked-cards':
      return <StageStackedCards stage={stage} onInView={onInView} />;
    case 'big-number':
      return <StageBigNumber stage={stage} onInView={onInView} />;
    default:
      return <StageHeroBleed stage={stage} onInView={onInView} />;
  }
}

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
        {supplyChainStages.map((stage, idx) => (
          <div key={stage.id}>
            <StageRouter stage={stage} onInView={handleInView} />
            {idx < supplyChainStages.length - 1 && (
              <PipelineConnector
                fromColor={stage.color}
                toColor={supplyChainStages[idx + 1].color}
                label={stage.pipelineLabel}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
