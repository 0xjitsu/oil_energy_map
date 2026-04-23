// src/components/services/ServicesHero.tsx
'use client';

import { servicesHero } from '@/data/services';
import { FadeIn } from '@/components/ui/FadeIn';

export function ServicesHero() {
  return (
    <section className="py-20 px-4 max-w-5xl mx-auto text-center">
      <FadeIn>
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-label mb-6">
          {servicesHero.eyebrow}
        </p>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight mb-6">
          {servicesHero.h1Line1}
          <br />
          <span className="text-status-red">{servicesHero.h1Line2}</span>
        </h1>
        <p className="text-text-body text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
          {servicesHero.subheadline}
        </p>

        {/* Stat chips */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {servicesHero.chips.map((chip) => (
            <span
              key={chip.text}
              className="glass-card px-4 py-2 font-mono text-xs text-text-secondary"
            >
              {chip.icon} {chip.text}
            </span>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap justify-center gap-4">
          {servicesHero.ctas.map((cta) => (
            <a
              key={cta.label}
              href={cta.href}
              className={
                cta.variant === 'primary'
                  ? 'inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-mono text-sm rounded-lg transition-colors min-h-[44px]'
                  : 'inline-flex items-center px-6 py-3 glass-card font-mono text-sm text-text-secondary hover:text-text-primary transition-colors min-h-[44px]'
              }
            >
              {cta.label}
            </a>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
