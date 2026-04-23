// src/components/services/PlatformFeatures.tsx
'use client';

import { platformFeatures } from '@/data/services';
import { FadeIn } from '@/components/ui/FadeIn';

export function PlatformFeatures() {
  return (
    <section className="py-20 px-4 max-w-5xl mx-auto">
      <FadeIn>
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-label text-center mb-4">
          THE PLATFORM
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-4">
          14 sections. Every number
          <br />
          <span className="text-purple-400">your bidder will ask for.</span>
        </h2>
        <p className="text-text-body text-center max-w-2xl mx-auto mb-12">
          A live intelligence dashboard built on the extracted data — navigable end-to-end without leaving the browser.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {platformFeatures.map((feature) => (
            <div
              key={feature.label}
              className="glass-card card-interactive p-4 flex flex-col items-center gap-2 text-center"
            >
              <span className="text-2xl" aria-hidden="true">{feature.emoji}</span>
              <span className="font-mono text-xs text-text-secondary">{feature.label}</span>
            </div>
          ))}
        </div>
      </FadeIn>
    </section>
  );
}
