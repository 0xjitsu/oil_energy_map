/**
 * Marks a number as scenario-derived, not live. Pattern follows the
 * established "Est." badge (ExecutiveSnapshot) — status-yellow, mono, tiny.
 */
export function SimChip({ label = 'Simulated' }: { label?: string }) {
  return (
    <span
      className="bg-status-yellow/10 text-status-yellow/70 font-mono text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider whitespace-nowrap"
      title="Derived from the scenario model, not live market data"
    >
      {label}
    </span>
  );
}
