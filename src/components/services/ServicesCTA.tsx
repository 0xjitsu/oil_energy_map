// src/components/services/ServicesCTA.tsx
'use client';

import { servicesCTA, audiencePills } from '@/data/services';
import { FadeIn } from '@/components/ui/FadeIn';

export function ServicesCTA() {
  return (
    <section id="contact" className="py-20 px-4 max-w-5xl mx-auto">
      <FadeIn>
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-label text-center mb-4">
          {servicesCTA.eyebrow}
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-4">
          {servicesCTA.h2Line1}
          <br />
          <span className="text-status-green">{servicesCTA.h2Line2}</span>
        </h2>
        <p className="text-text-body text-center max-w-2xl mx-auto mb-8">
          {servicesCTA.sub}
        </p>

        {/* Audience pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {audiencePills.map((pill) => (
            <span key={pill.label} className="glass-card px-4 py-2 font-mono text-xs text-text-secondary">
              {pill.emoji} {pill.label}
            </span>
          ))}
        </div>

        {/* Contact form */}
        <form
          action={`mailto:${servicesCTA.formEmail}?subject=RES/RAP Brief Request`}
          method="get"
          className="glass-card p-8 max-w-lg mx-auto space-y-5"
        >
          <div>
            <label htmlFor="svc-name" className="block font-mono text-[10px] uppercase tracking-widest text-text-label mb-2">
              Name
            </label>
            <input
              id="svc-name"
              type="text"
              name="name"
              required
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:border-border-hover transition-colors"
            />
          </div>

          <div>
            <label htmlFor="svc-org" className="block font-mono text-[10px] uppercase tracking-widest text-text-label mb-2">
              Organization
            </label>
            <input
              id="svc-org"
              type="text"
              name="organization"
              required
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:border-border-hover transition-colors"
            />
          </div>

          <div>
            <label htmlFor="svc-stores" className="block font-mono text-[10px] uppercase tracking-widest text-text-label mb-2">
              Approx. Store Count
            </label>
            <select
              id="svc-stores"
              name="stores"
              required
              defaultValue=""
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:border-border-hover transition-colors"
            >
              <option value="" disabled>Select range…</option>
              {servicesCTA.storeCountOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="svc-body" className="block font-mono text-[10px] uppercase tracking-widest text-text-label mb-2">
              Message
            </label>
            <textarea
              id="svc-body"
              name="body"
              rows={4}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:border-border-hover transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-mono text-sm rounded-lg transition-colors min-h-[44px]"
          >
            Request a Brief →
          </button>
        </form>
      </FadeIn>
    </section>
  );
}
