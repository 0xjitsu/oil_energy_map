'use client';

import { useMemo, useEffect } from 'react';
import { ScenarioParams, MapMode } from '@/types';
import { calculatePumpPrice } from '@/lib/scenario-engine';
import { usePrices } from '@/hooks/usePrices';
import { useScenarios } from '@/hooks/useScenarios';
import { ResultPanel } from './ResultPanel';
import { RiskMatrix } from './RiskMatrix';
import { ScenarioSlots } from './ScenarioSlots';
import { ScenarioCompare } from './ScenarioCompare';
import { InfoTip } from '@/components/ui/Tooltip';

interface ScenarioPlannerProps {
  params: ScenarioParams;
  onParamsChange: (params: ScenarioParams) => void;
  mapMode: MapMode;
  timelinePosition: number;
}

export function ScenarioPlanner({
  params,
  onParamsChange,
  mapMode,
  timelinePosition,
}: ScenarioPlannerProps) {
  const { prices } = usePrices();
  const liveBrent = prices.find((b) => b.id === 'brent-crude')?.value ?? 106;
  const liveForex = prices.find((b) => b.id === 'php-usd')?.value ?? 58.42;

  // Sync initial slider values with live prices once loaded (LIVE/SCENARIO only)
  useEffect(() => {
    if (mapMode !== 'timeline') {
      onParamsChange({
        ...params,
        brentPrice: Math.round(liveBrent),
        forexRate: liveForex,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveBrent, liveForex]);

  // In TIMELINE mode, derive params from timeline position
  useEffect(() => {
    if (mapMode === 'timeline') {
      const week = (timelinePosition / 1000) * 16;
      onParamsChange({
        brentPrice: Math.round(106 + week * 4.6), // price rises with disruption
        hormuzWeeks: Math.round(week),
        forexRate: 58.42 + week * 0.4, // peso weakens
        refineryOffline: week >= 12,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapMode, timelinePosition]);

  const isTimelineDriven = mapMode === 'timeline';

  const updateParam = <K extends keyof ScenarioParams>(key: K, value: ScenarioParams[K]) => {
    onParamsChange({ ...params, [key]: value });
  };

  const result = useMemo(() => calculatePumpPrice(params), [params]);
  const { scenarios, saveScenario, removeScenario } = useScenarios();

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-mono tracking-widest text-text-primary uppercase">
            Scenario Planner
          </h2>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-how-to-guide'))}
            className="p-1 rounded-md hover:bg-surface-hover transition-colors text-text-dim hover:text-text-secondary"
            aria-label="How to use scenario planner"
            title="How to use scenario planner"
          >
            <span className="text-[10px] font-mono">?</span>
          </button>
        </div>
        <p className="text-xs font-sans text-text-label mt-1">
          {isTimelineDriven ? 'Driven by timeline — scrub to explore' : 'What happens if...'}
        </p>
        <ScenarioSlots
          scenarios={scenarios}
          onLoad={(p) => onParamsChange(p)}
          onRemove={removeScenario}
          onSave={(name) => saveScenario(name, params)}
          disabled={isTimelineDriven}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className={`space-y-6 glass-card p-5 ${isTimelineDriven ? 'opacity-60' : ''}`}>
          {/* Brent Crude */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-widest text-text-label font-sans flex items-center gap-1.5">
                Brent Crude
                <InfoTip text="The global benchmark crude oil price. PH imports are priced against this." />
              </label>
              <span className="text-sm font-mono font-bold text-text-primary">
                ${params.brentPrice}/bbl
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={180}
              step={5}
              value={params.brentPrice}
              onChange={(e) => updateParam('brentPrice', Number(e.target.value))}
              disabled={isTimelineDriven}
              className="w-full h-1.5 rounded-full appearance-none bg-border-hover accent-blue-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-[9px] font-mono text-text-dim mt-1">
              <span>$60</span>
              <span>$180</span>
            </div>
          </div>

          {/* Hormuz Disruption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-widest text-text-label font-sans flex items-center gap-1.5">
                Hormuz Disruption
                <InfoTip text="Weeks the Strait of Hormuz is partially or fully blocked. 70% of PH crude transits here." />
              </label>
              <span className="text-sm font-mono font-bold text-text-primary">
                {params.hormuzWeeks} {params.hormuzWeeks === 1 ? 'week' : 'weeks'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={16}
              step={1}
              value={params.hormuzWeeks}
              onChange={(e) => updateParam('hormuzWeeks', Number(e.target.value))}
              disabled={isTimelineDriven}
              className="w-full h-1.5 rounded-full appearance-none bg-border-hover accent-orange-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-[9px] font-mono text-text-dim mt-1">
              <span>0 wk</span>
              <span>16 wk</span>
            </div>
          </div>

          {/* PHP/USD Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-widest text-text-label font-sans flex items-center gap-1.5">
                PHP/USD Rate
                <InfoTip text="The Philippine Peso to US Dollar exchange rate. Weaker peso = more expensive imports." />
              </label>
              <span className="text-sm font-mono font-bold text-text-primary">
                ₱{params.forexRate.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={54}
              max={65}
              step={0.5}
              value={params.forexRate}
              onChange={(e) => updateParam('forexRate', Number(e.target.value))}
              disabled={isTimelineDriven}
              className="w-full h-1.5 rounded-full appearance-none bg-border-hover accent-yellow-500 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className="flex justify-between text-[9px] font-mono text-text-dim mt-1">
              <span>₱54</span>
              <span>₱65</span>
            </div>
          </div>

          {/* Refinery Toggle */}
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest text-text-label font-sans flex items-center gap-1.5">
              Bataan Refinery Offline
              <InfoTip text="Petron Bataan is the only refinery in the Philippines. If offline, the country goes to 100% import dependency." />
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={params.refineryOffline}
              onClick={() => !isTimelineDriven && updateParam('refineryOffline', !params.refineryOffline)}
              disabled={isTimelineDriven}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:cursor-not-allowed ${
                params.refineryOffline ? 'bg-red-500' : 'bg-[rgba(255,255,255,0.12)]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${
                  params.refineryOffline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-4">
          <ResultPanel
            gasoline={result.gasoline}
            diesel={result.diesel}
            riskLevel={result.riskLevel}
          />
          <RiskMatrix params={params} riskLevel={result.riskLevel} />
        </div>
      </div>

      <ScenarioCompare scenarios={scenarios} />
    </div>
  );
}
