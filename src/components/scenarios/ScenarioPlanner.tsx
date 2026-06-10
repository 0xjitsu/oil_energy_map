'use client';

import { startTransition, useMemo, useEffect, useRef, useState } from 'react';
import { ScenarioParams, MapMode } from '@/types';
import { calculatePumpPrice } from '@/lib/scenario-engine';
import { usePrices } from '@/hooks/usePrices';
import { useScenarios } from '@/hooks/useScenarios';
import { ResultPanel } from './ResultPanel';
import { RiskMatrix } from './RiskMatrix';
import { ScenarioSlots } from './ScenarioSlots';
import { ScenarioCompare } from './ScenarioCompare';
import { InfoTip } from '@/components/ui/Tooltip';
import { ShareButton } from '@/components/ui/ShareButton';
import { decodeScenario, buildScenarioUrl, SCENARIO_PARAM } from '@/lib/scenario-url';
import { formatPHP, getBenchmarkValue } from '@/lib/format';

interface ScenarioPlannerProps {
  params: ScenarioParams;
  onParamsChange: (params: ScenarioParams | ((prev: ScenarioParams) => ScenarioParams)) => void;
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
  const liveBrent = getBenchmarkValue(prices, 'brent-crude');
  const liveForex = getBenchmarkValue(prices, 'php-usd');

  // Tracks whether a scenario was restored from the URL on first mount, so the
  // live-price sync below does not immediately clobber the shared Brent/forex.
  // Read synchronously in the ref initializer (not in an effect) so the gate is
  // set BEFORE any effect runs — the live-sync skip must not depend on the
  // declaration order of the two effects below.
  const urlScenarioRef = useRef(
    typeof window !== 'undefined' &&
      Boolean(new URLSearchParams(window.location.search).get(SCENARIO_PARAM)),
  );

  // On mount only: if the URL carries an `?s=` scenario, restore it. A shared
  // link should land the visitor on exactly the scenario the sharer modeled.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = new URLSearchParams(window.location.search).get(SCENARIO_PARAM);
    if (!raw) return;
    onParamsChange(decodeScenario(raw));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync slider values with live prices when they change (LIVE/SCENARIO only).
  // Functional updater avoids overwriting a concurrent slider edit with a stale closure.
  useEffect(() => {
    if (mapMode === 'timeline') return;
    // If a scenario was restored from the URL, skip the first live-price sync
    // so the shared Brent/forex survive. Subsequent ticks sync normally.
    if (urlScenarioRef.current) {
      urlScenarioRef.current = false;
      return;
    }
    onParamsChange((prev) => ({
      ...prev,
      brentPrice: Math.round(liveBrent),
      forexRate: liveForex,
    }));
  }, [liveBrent, liveForex, mapMode, onParamsChange]);

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

  // ── Slider INP fix ─────────────────────────────────────────────────────
  // Local mirror of the parent's params: sliders, readouts, and the result
  // panel render from this immediately; propagation to page.tsx (which
  // re-renders CrisisProvider + the deck.gl map) is coalesced to one
  // animation frame and marked non-urgent via startTransition.
  const [localParams, setLocalParams] = useState<ScenarioParams>(params);
  // The last object we sent upward. When `params` echoes our own update
  // (same reference), skip the sync so a mid-drag local value is never
  // clobbered by a stale parent commit. External updates (live-price sync,
  // timeline drive, slot load, URL restore) produce NEW objects → sync runs.
  const lastSentRef = useRef<ScenarioParams>(params);
  const sendRafRef = useRef(0);

  useEffect(() => {
    if (params !== lastSentRef.current) {
      // An external write (poll sync, timeline, slot load, URL restore) wins:
      // cancel any pending drag propagation so a stale frame can't re-send
      // old params after the mirror has already adopted the external values.
      cancelAnimationFrame(sendRafRef.current);
      setLocalParams(params);
    }
  }, [params]);

  useEffect(() => () => cancelAnimationFrame(sendRafRef.current), []);

  const updateParam = <K extends keyof ScenarioParams>(key: K, value: ScenarioParams[K]) => {
    setLocalParams((prev) => {
      const next = { ...prev, [key]: value };
      cancelAnimationFrame(sendRafRef.current);
      sendRafRef.current = requestAnimationFrame(() => {
        lastSentRef.current = next;
        startTransition(() => onParamsChange(next));
      });
      return next;
    });
  };
  // ───────────────────────────────────────────────────────────────────────

  const result = useMemo(() => calculatePumpPrice(localParams), [localParams]);
  const { scenarios, saveScenario, removeScenario } = useScenarios();

  const [shareUrl, setShareUrl] = useState('');
  useEffect(() => {
    if (typeof window === 'undefined') return;
    setShareUrl(buildScenarioUrl(localParams, window.location.origin, '/'));
  }, [localParams]);

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center justify-between gap-2">
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
          {shareUrl && !isTimelineDriven && (
            <ShareButton
              url={shareUrl}
              title="PH Oil scenario"
              text="See the fuel-price shock I modeled on the PH Energy Intelligence Map"
            />
          )}
        </div>
        <p className="text-xs font-sans text-text-label mt-1">
          {isTimelineDriven ? 'Driven by timeline — scrub to explore' : 'What happens if...'}
        </p>
        <ScenarioSlots
          scenarios={scenarios}
          onLoad={(p) => onParamsChange(p)}
          onRemove={removeScenario}
          onSave={(name) => saveScenario(name, localParams)}
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
                ${localParams.brentPrice}/bbl
              </span>
            </div>
            <input
              id="brent-price-slider"
              type="range"
              min={60}
              max={180}
              step={5}
              aria-label="Brent Crude price"
              value={localParams.brentPrice}
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
                {localParams.hormuzWeeks} {localParams.hormuzWeeks === 1 ? 'week' : 'weeks'}
              </span>
            </div>
            <input
              id="hormuz-weeks-slider"
              type="range"
              min={0}
              max={16}
              step={1}
              aria-label="Hormuz disruption weeks"
              value={localParams.hormuzWeeks}
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
                {formatPHP(localParams.forexRate)}
              </span>
            </div>
            <input
              id="forex-rate-slider"
              type="range"
              min={54}
              max={65}
              step={0.5}
              aria-label="PHP/USD exchange rate"
              value={localParams.forexRate}
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
              aria-label="Bataan Refinery Offline toggle"
              aria-checked={localParams.refineryOffline}
              onClick={() => !isTimelineDriven && updateParam('refineryOffline', !localParams.refineryOffline)}
              disabled={isTimelineDriven}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 disabled:cursor-not-allowed ${
                localParams.refineryOffline ? 'bg-status-red' : 'bg-[rgba(255,255,255,0.12)]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-200 ${
                  localParams.refineryOffline ? 'translate-x-5' : 'translate-x-0'
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
          <RiskMatrix params={localParams} riskLevel={result.riskLevel} />
        </div>
      </div>

      <ScenarioCompare scenarios={scenarios} />
    </div>
  );
}
