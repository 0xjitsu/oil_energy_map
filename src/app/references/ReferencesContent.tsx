'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import type { DataReference } from '@/data/references';

function StatusBadge({ status }: { status: 'active' | 'baseline' | 'simulated' }) {
  const styles = {
    active: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
    simulated: 'border-amber-500/20 bg-amber-500/10 text-amber-400',
    baseline: 'border-blue-500/20 bg-blue-500/10 text-blue-400',
  };
  const labels = {
    active: 'Active',
    simulated: 'Simulated',
    baseline: 'Baseline',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

export function ReferencesContent({ references }: { references: DataReference[] }) {
  const activeCount = references.filter((r) => r.status === 'active').length;
  const simulatedCount = references.filter((r) => r.status === 'simulated').length;
  const baselineCount = references.filter((r) => r.status === 'baseline').length;

  return (
    <div className="min-h-screen bg-bg-primary overflow-x-hidden">
      <Header showTicker={false} />

      <main className="max-w-[1600px] mx-auto px-4 py-8 sm:px-6">
        {/* Hero */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-petron" />
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              Data Provenance
            </h2>
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-text-primary tracking-tight">
            Data Sources &amp; Provenance
          </h1>
          <p className="mt-2 text-sm font-sans text-text-secondary max-w-2xl leading-relaxed">
            Every number on the dashboard traces back to a source. This page catalogs the{' '}
            {references.length} data feeds powering the PH Oil Intelligence platform — from
            10,000+ gas stations to real-time NLP sentiment.
          </p>

          {/* Summary badges */}
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-xs text-text-body">
                {activeCount} Active
              </span>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="font-mono text-xs text-text-body">
                {simulatedCount} Simulated
              </span>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="font-mono text-xs text-text-body">
                {baselineCount} Baseline
              </span>
            </div>
          </div>
        </section>

        {/* Desktop table */}
        <section className="glass-card overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle">
                  {['Source', 'Data Type', 'Records', 'Frequency', 'Status', 'License', 'Verified'].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-text-muted font-medium"
                      >
                        {col}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {references.map((ref) => (
                  <tr
                    key={ref.name}
                    className="border-b border-surface-hover hover:bg-surface-hover transition-colors"
                  >
                    <td className="px-5 py-4">
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-sans text-text-primary hover:text-petron transition-colors"
                      >
                        {ref.name}
                        <span className="inline-block ml-1 text-text-dim text-xs">
                          &#8599;
                        </span>
                      </a>
                      <p className="mt-1 text-[11px] text-text-subtle leading-snug max-w-sm">
                        {ref.description}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-text-body">
                      {ref.dataType}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-text-body">
                      {ref.recordCount}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-text-body">
                      {ref.updateFrequency}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={ref.status} />
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-text-subtle">
                      {ref.license ?? '—'}
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-text-subtle">
                      {ref.lastVerified}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Mobile cards */}
        <section className="md:hidden space-y-3">
          {references.map((ref) => (
            <a
              key={ref.name}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card block p-4 hover:bg-surface-hover transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-sans text-text-primary">
                  {ref.name}
                  <span className="inline-block ml-1 text-text-dim text-xs">
                    &#8599;
                  </span>
                </h3>
                <StatusBadge status={ref.status} />
              </div>
              <p className="text-[11px] text-text-subtle leading-snug mb-3">
                {ref.description}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted">
                    Type
                  </span>
                  <p className="font-mono text-xs text-text-body">{ref.dataType}</p>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted">
                    Records
                  </span>
                  <p className="font-mono text-xs text-text-body">
                    {ref.recordCount}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted">
                    Frequency
                  </span>
                  <p className="font-mono text-xs text-text-body">
                    {ref.updateFrequency}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-text-muted">
                    License
                  </span>
                  <p className="font-mono text-xs text-text-body">
                    {ref.license ?? '—'}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </section>

        {/* Disclaimer */}
        <section className="mt-8 glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-shell" />
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              Data Freshness Note
            </h2>
          </div>
          <div className="text-xs font-sans text-text-label leading-relaxed space-y-2">
            <p>
              <strong className="text-text-body">Active</strong> sources are
              connected to live APIs and update automatically during dashboard operation.
            </p>
            <p>
              <strong className="text-text-body">Simulated</strong> sources use
              realistic synthetic data modeled on official government publications. In a production
              deployment, these would connect to real-time DOE, BSP, and EIA APIs.
            </p>
            <p>
              <strong className="text-text-body">Baseline</strong> sources represent
              static infrastructure data (refinery locations, terminal capacities) that changes
              infrequently.
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
