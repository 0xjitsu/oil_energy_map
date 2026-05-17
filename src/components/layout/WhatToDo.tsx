'use client';

interface ActionCard {
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}

const ACTIONS: ActionCard[] = [
  {
    eyebrow: 'Understand',
    title: 'Trace where your fuel comes from',
    body: 'The 7-stage journey from a Middle East wellhead to a Philippine pump.',
    href: '/primer',
    cta: 'Read the oil primer →',
  },
  {
    eyebrow: 'See the impact',
    title: 'What a shock costs a family',
    body: 'Follow a crude-price spike down to jeepney fares, rice, and the monthly grocery bill.',
    href: '/cascade',
    cta: 'See the cost cascade →',
  },
  {
    eyebrow: 'Act',
    title: 'Cut a franchise energy bill',
    body: 'Multi-site operators can switch to competitive RES/RAP supply — roughly 20% off distribution-utility rates.',
    href: '/services',
    cta: 'Explore RES/RAP services →',
  },
];

/**
 * Act 5 — the dashboard's closing call to action. After the data, the story
 * ends with what the reader can actually do next.
 */
export function WhatToDo() {
  return (
    <section className="scroll-mt-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ACTIONS.map((action) => (
          <a
            key={action.href}
            href={action.href}
            className="glass-card card-interactive p-5 flex flex-col"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-text-label mb-2">
              {action.eyebrow}
            </p>
            <h3 className="text-text-primary font-bold text-base mb-2">{action.title}</h3>
            <p className="text-text-body text-sm leading-relaxed flex-1">{action.body}</p>
            <span className="mt-4 font-mono text-xs uppercase tracking-widest text-petron">
              {action.cta}
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
