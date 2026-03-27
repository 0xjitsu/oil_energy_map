'use client';

import { useState, useMemo, useEffect } from 'react';
import { ScenarioParams } from '@/types';
import { calculatePumpPrice } from '@/lib/scenario-engine';
import { usePrices } from '@/hooks/usePrices';
import { ResultPanel } from './ResultPanel';
import { RiskMatrix } from './RiskMatrix';
import { Tooltip } from '@/components/ui/Tooltip';

export function ScenarioPlanner() {
  const { prices } = usePrices();
  const liveBrent = prices.find((b) => b.id === 'brent-crude')?.value ?? 106;
  const liveForex = prices.find((b) => b.id === 'php-usd')?.value ?? 58.42;

  const [brentPrice, setBrentPrice] = useState(106);
  const [hormuzWeeks, setHormuzWeeks] = useState(2);
  const [forexRate, setForexRate] = useState(58.42);

  // Sync initial slider values with live prices once loaded
  useEffect(() => { setBrentPrice(Math.round(liveBrent)); }, [liveBrent]);
  useEffect(() => { setForexRate(liveForex); }, [liveForex]);
  const [refineryOffline, setRefineryOffline] = useState(false);

  const params: ScenarioParams = useMemo(
    () => ({ brentPrice, hormuzWeeks, forexRate, refineryOffline }),
    [brentPrice, hormuzWeeks, forexRate, refineryOffline]
  );

  const result = useMemo(() => calculatePumpPrice(params), [params]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-sm font-mono tracking-widest text-[rgba(255,255,255,0.9)] uppercase">
          Scenario Planner
        </h2>
        <p className="text-xs font-sans text-[rgba(255,255,255,0.4)] mt-1">
          What happens if...
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sliders */}
        <div className="space-y-6 glass-card p-5">
          {/* Brent Crude */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Tooltip text="The global benchmark crude oil price. PH imports are priced against this.">
                <label className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.4)] font-sans cursor-help">
                  Brent Crude
                </label>
              </Tooltip>
              <span className="text-sm font-mono font-bold text-[rgba(255,255,255,0.9)]">
                ${brentPrice}/bbl
              </span>
            </div>
            <input
              type="range"
              min={60}
              max={180}
              step={5}
              value={brentPrice}
              onChange={(e) => setBrentPrice(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-[rgba(255,255,255,0.08)] accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-[rgba(255,255,255,0.2)] mt-1">
              <span>$60</span>
              <span>$180</span>
            </div>
          </div>

          {/* Hormuz Disruption */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Tooltip text="Weeks the Strait of Hormuz is partially or fully blocked. 70% of PH crude transits here.">
                <label className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.4)] font-sans cursor-help">
                  Hormuz Disruption
                </label>
              </Tooltip>
              <span className="text-sm font-mono font-bold text-[rgba(255,255,255,0.9)]">
                {hormuzWeeks} {hormuzWeeks === 1 ? 'week' : 'weeks'}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={16}
              step={1}
              value={hormuzWeeks}
              onChange={(e) => setHormuzWeeks(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-[rgba(255,255,255,0.08)] accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-[rgba(255,255,255,0.2)] mt-1">
              <span>0 wk</span>
              <span>16 wk</span>
            </div>
          </div>

          {/* PHP/USD Rate */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Tooltip text="The Philippine Peso to US Dollar exchange rate. Weaker peso = more expensive imports.">
                <label className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.4)] font-sans cursor-help">
                  PHP/USD Rate
                </label>
              </Tooltip>
              <span className="text-sm font-mono font-bold text-[rgba(255,255,255,0.9)]">
                ₱{forexRate.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={54}
              max={65}
              step={0.5}
              value={forexRate}
              onChange={(e) => setForexRate(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-[rgba(255,255,255,0.08)] accent-yellow-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-mono text-[rgba(255,255,255,0.2)] mt-1">
              <span>₱54</span>
              <span>₱65</span>
            </div>
          </div>

          {/* Refinery Toggle */}
          <div className="flex items-center justify-between">
            <Tooltip text="Petron Bataan is the only refinery in the Philippines. If offline, the country goes to 100% import dependency.">
              <label className="text-[10px] uppercase tracking-widest text-[rgba(255,255,255,0.4)] font-sans cursor-help">
                Bataan Refinery Offline
              </label>
            </Tooltip>
            <button
              type="button"
              role="switch"
              aria-checked={refineryOffline}
              onClick={() => setRefineryOffline((v) => !v)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                refineryOffline ? 'bg-red-500' : 'bg-[rgba(255,255,255,0.12)]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${
                  refineryOffline ? 'translate-x-5' : 'translate-x-0'
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
    </div>
  );
}
