// src/components/services/SavingsOpportunity.tsx
'use client';

import { useState } from 'react';
import { savingsSlider, savingsTiers, kpiCards } from '@/data/services';
import { FadeIn } from '@/components/ui/FadeIn';

function formatPeso(amount: number): string {
  if (amount >= 1_000_000_000) return `₱${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000)     return `₱${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000)         return `₱${(amount / 1_000).toFixed(0)}K`;
  return `₱${amount.toLocaleString('en-PH')}`;
}

export function SavingsOpportunity() {
  const [stores, setStores] = useState<number>(savingsSlider.defaultValue);

  const monthlySpend    = stores * savingsSlider.avgPerStore;
  const monthlySavings  = monthlySpend * savingsSlider.savingsRate;
  const yearlySavings   = monthlySavings * 12;

  return (
    <section id="savings" className="py-20 px-4 max-w-5xl mx-auto">
      <FadeIn>
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-label text-center mb-4">
          THE OPPORTUNITY
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-4">
          ~20% savings vs. distribution utility rates.
          <br />
          <span className="text-status-green">At scale, that&apos;s not a rounding error.</span>
        </h2>
        <p className="text-text-body text-center max-w-2xl mx-auto mb-12">
          Philippine RES contracts via RAP offer significant cost reduction vs. locked-in DU rates —
          and the gap compounds with every store you add.
        </p>

        {/* ── Live Slider ── */}
        <div className="glass-card p-6 mb-8 max-w-2xl mx-auto">
          <label className="block text-text-secondary font-mono text-sm mb-1">
            How many stores does your franchise operate?
          </label>
          <div className="font-mono text-2xl font-bold text-text-primary mb-4">
            {stores.toLocaleString()} stores
          </div>
          <input
            type="range"
            min={savingsSlider.min}
            max={savingsSlider.max}
            step={savingsSlider.step}
            value={stores}
            onChange={(e) => setStores(Number(e.target.value))}
            className="w-full cursor-pointer accent-blue-500"
            style={{ minHeight: 44 }}
            aria-label="Number of franchise stores"
          />
          <div className="flex justify-between font-mono text-[10px] text-text-dim mb-6">
            <span>{savingsSlider.min}</span>
            <span>{savingsSlider.max.toLocaleString()}</span>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-baseline">
              <span className="text-text-muted font-mono text-xs">Est. monthly electricity spend</span>
              <span className="text-text-primary font-mono font-bold text-lg">
                {formatPeso(monthlySpend)}
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-text-muted font-mono text-xs">~20% RES/RAP savings / month</span>
              <span className="text-status-green font-mono font-bold text-xl">
                {formatPeso(monthlySavings)}
              </span>
            </div>
            <div className="flex justify-between items-baseline border-t border-border-subtle pt-4">
              <span className="text-text-muted font-mono text-xs">Annual savings potential</span>
              <span className="text-status-green font-mono font-bold text-3xl">
                {formatPeso(yearlySavings)}
              </span>
            </div>
          </div>
          <p className="text-text-dim font-mono text-[10px] mt-4 leading-relaxed">
            Based on ₱80,000 avg monthly electricity spend per store. Actual savings depend on
            your DU mix, consumption profile, and RES bid terms.
          </p>
        </div>

        {/* ── Tiered Table ── */}
        <div className="glass-card overflow-hidden mb-12">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" aria-label="Savings by franchise scale">
              <thead>
                <tr className="border-b border-border-subtle">
                  {(['Stores', 'Est. Monthly Spend', '~20% Savings/mo', 'Savings/Year'] as const).map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className={`py-3 px-4 font-mono text-[10px] uppercase tracking-widest text-text-label ${
                        h === 'Stores' ? 'text-left' : 'text-right'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {savingsTiers.map((tier) => (
                  <tr key={tier.stores} className="border-b border-border last:border-0">
                    <td className="py-3 px-4 font-mono text-xs text-text-secondary">{tier.stores}</td>
                    <td className="py-3 px-4 font-mono text-xs text-text-body text-right">{tier.monthlySpend}</td>
                    <td className="py-3 px-4 font-mono text-xs text-status-green text-right font-bold">{tier.savingsPerMonth}</td>
                    <td className="py-3 px-4 font-mono text-xs text-status-green text-right font-bold">{tier.savingsPerYear}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {kpiCards.map((card) => (
            <div key={card.value} className="glass-card p-6 text-center">
              <div className="font-mono text-3xl font-bold text-status-green mb-1">{card.value}</div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-text-label">{card.label}</div>
              <div className="text-text-dim text-xs mt-1">{card.sub}</div>
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
