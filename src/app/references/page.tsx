import Link from 'next/link';
import { dataReferences } from '@/data/references';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Sources & Provenance — PH Oil Intelligence',
  description:
    'Every data source used in the PH Oil Intelligence dashboard, with provenance metadata, update frequency, and licensing information.',
};

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

export default function ReferencesPage() {
  const activeCount = dataReferences.filter((r) => r.status === 'active').length;
  const simulatedCount = dataReferences.filter((r) => r.status === 'simulated').length;
  const baselineCount = dataReferences.filter((r) => r.status === 'baseline').length;

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Minimal header bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[rgba(6,10,16,0.85)]">
        <div className="flex h-[3px]">
          <div className="flex-1 bg-[#0038a8]" />
          <div className="flex-1 bg-[#ce1126]" />
          <div className="flex-1 bg-[#fcd116]" />
        </div>
        <div className="flex items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/"
            className="text-sm font-mono tracking-widest text-[rgba(255,255,255,0.9)] uppercase hover:text-white transition-colors"
          >
            Energy Intelligence Map
          </Link>
          <span className="text-[10px] font-mono tracking-widest text-[rgba(255,255,255,0.3)] uppercase">
            Data Provenance
          </span>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 py-8 sm:px-6">
        {/* Hero */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-petron)]" />
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              Data Provenance
            </h2>
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-[var(--text-primary)] tracking-tight">
            Data Sources &amp; Provenance
          </h1>
          <p className="mt-2 text-sm font-sans text-[rgba(255,255,255,0.45)] max-w-2xl leading-relaxed">
            Every number on the dashboard traces back to a source. This page catalogs the{' '}
            {dataReferences.length} data feeds powering the PH Oil Intelligence platform — from
            10,000+ gas stations to real-time NLP sentiment.
          </p>

          {/* Summary badges */}
          <div className="flex flex-wrap gap-3 mt-5">
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-mono text-xs text-[rgba(255,255,255,0.6)]">
                {activeCount} Active
              </span>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="font-mono text-xs text-[rgba(255,255,255,0.6)]">
                {simulatedCount} Simulated
              </span>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="font-mono text-xs text-[rgba(255,255,255,0.6)]">
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
                <tr className="border-b border-[rgba(255,255,255,0.06)]">
                  {['Source', 'Data Type', 'Records', 'Frequency', 'Status', 'License'].map(
                    (col) => (
                      <th
                        key={col}
                        className="px-5 py-3 text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] font-medium"
                      >
                        {col}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {dataReferences.map((ref) => (
                  <tr
                    key={ref.name}
                    className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-sans text-[var(--text-primary)] hover:text-[var(--accent-petron)] transition-colors"
                      >
                        {ref.name}
                        <span className="inline-block ml-1 text-[rgba(255,255,255,0.2)] text-xs">
                          &#8599;
                        </span>
                      </a>
                      <p className="mt-1 text-[11px] text-[rgba(255,255,255,0.3)] leading-snug max-w-sm">
                        {ref.description}
                      </p>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[rgba(255,255,255,0.6)]">
                      {ref.dataType}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[rgba(255,255,255,0.6)]">
                      {ref.recordCount}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[rgba(255,255,255,0.6)]">
                      {ref.updateFrequency}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={ref.status} />
                    </td>
                    <td className="px-5 py-4 font-mono text-[11px] text-[rgba(255,255,255,0.35)]">
                      {ref.license ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Mobile cards */}
        <section className="md:hidden space-y-3">
          {dataReferences.map((ref) => (
            <a
              key={ref.name}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card block p-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="text-sm font-sans text-[var(--text-primary)]">
                  {ref.name}
                  <span className="inline-block ml-1 text-[rgba(255,255,255,0.2)] text-xs">
                    &#8599;
                  </span>
                </h3>
                <StatusBadge status={ref.status} />
              </div>
              <p className="text-[11px] text-[rgba(255,255,255,0.3)] leading-snug mb-3">
                {ref.description}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                    Type
                  </span>
                  <p className="font-mono text-xs text-[rgba(255,255,255,0.6)]">{ref.dataType}</p>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                    Records
                  </span>
                  <p className="font-mono text-xs text-[rgba(255,255,255,0.6)]">
                    {ref.recordCount}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                    Frequency
                  </span>
                  <p className="font-mono text-xs text-[rgba(255,255,255,0.6)]">
                    {ref.updateFrequency}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--text-muted)]">
                    License
                  </span>
                  <p className="font-mono text-xs text-[rgba(255,255,255,0.6)]">
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
            <div className="w-2 h-2 rounded-full bg-[var(--accent-shell)]" />
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              Data Freshness Note
            </h2>
          </div>
          <div className="text-xs font-sans text-[rgba(255,255,255,0.4)] leading-relaxed space-y-2">
            <p>
              <strong className="text-[rgba(255,255,255,0.6)]">Active</strong> sources are
              connected to live APIs and update automatically during dashboard operation.
            </p>
            <p>
              <strong className="text-[rgba(255,255,255,0.6)]">Simulated</strong> sources use
              realistic synthetic data modeled on official government publications. In a production
              deployment, these would connect to real-time DOE, BSP, and EIA APIs.
            </p>
            <p>
              <strong className="text-[rgba(255,255,255,0.6)]">Baseline</strong> sources represent
              static infrastructure data (refinery locations, terminal capacities) that changes
              infrequently.
            </p>
          </div>
        </section>

        {/* Back link */}
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-mono text-xs text-[rgba(255,255,255,0.35)] hover:text-[var(--accent-petron)] transition-colors tracking-wider uppercase"
          >
            <span>&#8592;</span> Back to Dashboard
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[rgba(255,255,255,0.04)] py-4 px-4 sm:px-6 relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.08)] to-transparent" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-mono text-[rgba(255,255,255,0.3)]">
              PH Oil Intelligence Dashboard — {dataReferences.length} data sources cataloged
            </p>
            <p className="text-[10px] font-mono text-[rgba(255,255,255,0.2)] mt-0.5">
              For educational purposes. Not financial advice.
            </p>
          </div>
          <p className="text-[10px] font-mono text-[rgba(255,255,255,0.2)]">
            Built with Next.js + MapLibre
          </p>
        </div>
      </footer>
    </div>
  );
}
