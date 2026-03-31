'use client';

import { useState } from 'react';

interface DisclaimerProps {
  showRoadmap?: boolean;
}

export function Disclaimer({ showRoadmap = true }: DisclaimerProps) {
  const [roadmapOpen, setRoadmapOpen] = useState(false);

  return (
    <div className="glass-card disclaimer-card p-4">
      <div className="flex items-start gap-2">
        <span className="text-amber-500 text-sm mt-0.5">⚠️</span>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber-500 mb-1">
            Simulation Disclaimer
          </p>
          <p className="text-[11px] font-sans text-text-secondary leading-relaxed">
            These projections use simplified Monte Carlo modeling with assumed probability distributions.
            They are for educational and discussion purposes only — not investment, policy, or operational advice.
            Real-world outcomes depend on factors not captured in this model including geopolitical events,
            weather, regulatory changes, and market speculation.
          </p>

          {showRoadmap && (
            <div className="mt-3">
              <button
                onClick={() => setRoadmapOpen(!roadmapOpen)}
                className="text-[10px] font-mono text-text-dim hover:text-text-secondary"
              >
                {roadmapOpen ? '▼' : '▶'} Phase C Roadmap: Backend Simulation Engine
              </button>
              <div className={`accordion-content ${roadmapOpen ? 'open' : ''}`}>
                <div className="accordion-inner">
                  <ul className="mt-2 space-y-1 text-[10px] font-mono text-text-dim list-disc list-inside">
                    <li>Historical correlation matrices (vs assumed distributions)</li>
                    <li>10,000+ server-side runs (vs 1,000 client-side)</li>
                    <li>Back-testing against actual outcomes</li>
                    <li>Time-series database (Supabase)</li>
                    <li>REST API for DOE/NEDA integration</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
