'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  roadmapPhases,
  dataSourceUpgrades,
  contributorOpportunities,
  type RoadmapItem,
  type DataSourceUpgrade,
  type ContributorOpportunity,
} from '@/data/roadmap';

function StatusBadge({ status }: { status: RoadmapItem['status'] }) {
  const styles: Record<RoadmapItem['status'], string> = {
    done: 'bg-status-green/10 text-status-green',
    'in-progress': 'bg-status-yellow/10 text-status-yellow',
    planned: 'bg-petron/10 text-petron',
    future: 'bg-surface-hover text-text-subtle',
  };
  const labels: Record<RoadmapItem['status'], string> = {
    done: 'Shipped',
    'in-progress': 'In Progress',
    planned: 'Planned',
    future: 'Future',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: ContributorOpportunity['difficulty'] }) {
  const styles: Record<ContributorOpportunity['difficulty'], string> = {
    beginner: 'bg-status-green/10 text-status-green',
    intermediate: 'bg-status-yellow/10 text-status-yellow',
    advanced: 'bg-status-red/10 text-status-red',
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${styles[difficulty]}`}
    >
      {difficulty}
    </span>
  );
}

function TagPill({ tag }: { tag: string }) {
  return (
    <span className="bg-surface-hover text-text-label rounded px-1.5 py-0.5 text-[10px] font-mono">
      {tag}
    </span>
  );
}

const phaseCircleColors: Record<string, string> = {
  'ph-foundation': 'bg-status-green',
  'ph-enrichment': 'bg-status-yellow',
  'asean-expansion': 'bg-border-hover',
  'global-vision': 'bg-border-hover',
};

export function RoadmapContent() {
  const allItems = roadmapPhases.flatMap((p) => p.items);
  const shippedCount = allItems.filter((i) => i.status === 'done').length;
  const inProgressCount = allItems.filter((i) => i.status === 'in-progress').length;
  const plannedCount = allItems.filter(
    (i) => i.status === 'planned' || i.status === 'future'
  ).length;

  return (
    <div className="min-h-screen bg-bg-primary overflow-x-clip">
      <Header showTicker={false} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* A. Hero */}
        <section className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-petron" />
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              Roadmap
            </h2>
          </div>
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-text-primary tracking-tight">
            What We&apos;re Building
          </h1>
          <p className="mt-2 text-sm font-sans text-text-secondary max-w-2xl leading-relaxed">
            From Philippine fuel intelligence to a global energy disruption map.
            This is our phased plan to build the pandemic-tracker equivalent for
            energy markets.
          </p>

          <div className="flex flex-wrap gap-3 mt-5">
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-status-green" />
              <span className="font-mono text-xs text-text-body">
                {shippedCount} Shipped
              </span>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-status-yellow" />
              <span className="font-mono text-xs text-text-body">
                {inProgressCount} In Progress
              </span>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-petron" />
              <span className="font-mono text-xs text-text-body">
                {plannedCount} Planned
              </span>
            </div>
          </div>
        </section>

        {/* B. Phase Timeline */}
        <section className="mb-16">
          <div className="relative border-l-2 border-border-hover pl-8 space-y-8">
            {roadmapPhases.map((phase) => (
              <div key={phase.id} className="relative">
                {/* Circle marker */}
                <div
                  className={`absolute -left-[9px] top-6 w-4 h-4 rounded-full border-2 border-bg-primary ${phaseCircleColors[phase.id] ?? 'bg-border-hover'}`}
                />

                <div className="glass-card p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
                      {phase.phase}
                    </span>
                  </div>
                  <h3 className="text-lg font-mono font-bold text-text-primary">
                    {phase.title}
                  </h3>
                  <p className="text-sm font-sans text-text-secondary mt-1 mb-4">
                    {phase.subtitle}
                  </p>

                  <div className="space-y-3">
                    {phase.items.map((item) => (
                      <div
                        key={item.title}
                        className="border border-border-subtle rounded-lg p-3"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-sans text-text-primary">
                            {item.title}
                          </h4>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-[11px] font-sans text-text-subtle leading-snug mb-2">
                          {item.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {item.tags.map((tag) => (
                            <TagPill key={tag} tag={tag} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* C. Data Source Upgrades */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-petron" />
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              Data Pipeline
            </h2>
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-bold text-text-primary tracking-tight mb-2">
            Data Source Upgrades
          </h2>
          <p className="text-sm font-sans text-text-secondary max-w-2xl leading-relaxed mb-6">
            Replacing derived and static data with authoritative, real-time
            sources. Each upgrade improves accuracy and reduces latency for
            downstream consumers.
          </p>

          <div className="space-y-4">
            {dataSourceUpgrades.map((upgrade) => (
              <div key={upgrade.name} className="glass-card p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-sans font-bold text-text-primary">
                    {upgrade.name}
                  </h3>
                  <StatusBadge status={upgrade.status} />
                </div>
                <div className="text-xs font-mono text-text-body mb-2">
                  <span className="text-text-subtle">{upgrade.current}</span>
                  <span className="text-text-muted mx-2">→</span>
                  <span className="text-text-primary">{upgrade.planned}</span>
                </div>
                <p className="text-[11px] font-sans text-text-subtle leading-snug">
                  {upgrade.impact}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* D. Contributor Opportunities */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-petron" />
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
              Open Source
            </h2>
          </div>
          <h2 className="text-2xl sm:text-3xl font-mono font-bold text-text-primary tracking-tight mb-2">
            Get Involved
          </h2>
          <p className="text-sm font-sans text-text-secondary max-w-2xl leading-relaxed mb-6">
            The dashboard is open source. Pick an issue that matches your skill
            level and start contributing.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {contributorOpportunities.map((opp) => (
              <div key={opp.title} className="glass-card p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-sans font-bold text-text-primary">
                    {opp.title}
                  </h3>
                  <DifficultyBadge difficulty={opp.difficulty} />
                </div>
                <p className="text-[11px] font-sans text-text-subtle leading-snug mb-3">
                  {opp.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {opp.tags.map((tag) => (
                    <TagPill key={tag} tag={tag} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* E. Bottom CTA */}
        <section>
          <div className="glass-card p-6 sm:p-8 text-center">
            <h2 className="text-lg font-mono font-bold text-text-primary mb-2">
              Ready to contribute?
            </h2>
            <a
              href="https://github.com/0xjitsu/oil_energy_map"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-sans text-petron hover:text-text-primary transition-colors"
            >
              View on GitHub →
            </a>
            <p className="mt-2 text-[11px] font-sans text-text-subtle">
              Read CLAUDE.md for coding conventions and project rules
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
