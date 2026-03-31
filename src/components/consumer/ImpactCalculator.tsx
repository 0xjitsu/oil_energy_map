'use client';

import { useState, useMemo } from 'react';
import type { ScenarioParams } from '@/types';
import { PERSONAS, calculateImpact } from '@/lib/consumer-models';
import { PersonaCard } from './PersonaCard';
import { ImpactResult } from './ImpactResult';

interface ImpactCalculatorProps {
  scenarioParams: ScenarioParams;
}

export function ImpactCalculator({ scenarioParams }: ImpactCalculatorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const impacts = useMemo(
    () => PERSONAS.map((p) => ({ persona: p, impact: calculateImpact(p, scenarioParams) })),
    [scenarioParams],
  );

  const selected = impacts.find((i) => i.persona.id === selectedId);

  return (
    <div>
      <h2 className="text-sm font-mono tracking-widest text-text-primary uppercase">
        How Does This Affect You?
      </h2>
      <p className="text-xs font-sans text-text-label mt-1 mb-4">
        Select a persona to see personalized fuel cost impact
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {impacts.map(({ persona, impact }) => (
          <PersonaCard
            key={persona.id}
            persona={persona}
            impact={impact}
            selected={selectedId === persona.id}
            onClick={() => setSelectedId(selectedId === persona.id ? null : persona.id)}
          />
        ))}
      </div>

      {selected && (
        <div className="mt-4">
          <ImpactResult persona={selected.persona} impact={selected.impact} />
        </div>
      )}
    </div>
  );
}
