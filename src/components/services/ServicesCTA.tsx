// src/components/services/ServicesCTA.tsx
'use client';

import { useState } from 'react';
import { servicesCTA, audiencePills } from '@/data/services';
import { FadeIn } from '@/components/ui/FadeIn';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function ServicesCTA() {
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [stores, setStores] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, organization: org, storeCount: stores, message }),
      });

      if (!res.ok) throw new Error('Server error');
      setStatus('success');
    } catch {
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <section id="contact" className="py-20 px-4 max-w-5xl mx-auto">
        <div className="glass-card p-12 max-w-lg mx-auto text-center">
          <div className="text-4xl mb-4">✓</div>
          <h3 className="font-mono font-bold text-text-primary text-xl mb-2">Request received</h3>
          <p className="text-text-body text-sm leading-relaxed">
            We&apos;ll be in touch shortly with next steps for your RES/RAP brief.
          </p>
        </div>
      </section>
    );
  }

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
        <form onSubmit={handleSubmit} className="glass-card p-8 max-w-lg mx-auto space-y-5">
          <div>
            <label htmlFor="svc-name" className="block font-mono text-[10px] uppercase tracking-widest text-text-label mb-2">
              Name
            </label>
            <input
              id="svc-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              required
              value={org}
              onChange={(e) => setOrg(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:border-border-hover transition-colors"
            />
          </div>

          <div>
            <label htmlFor="svc-stores" className="block font-mono text-[10px] uppercase tracking-widest text-text-label mb-2">
              Approx. Store Count
            </label>
            <select
              id="svc-stores"
              required
              value={stores}
              onChange={(e) => setStores(e.target.value)}
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
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-bg-elevated border border-border-subtle rounded-lg px-4 py-3 text-text-primary font-mono text-sm focus:outline-none focus:border-border-hover transition-colors resize-none"
            />
          </div>

          {status === 'error' && (
            <p className="font-mono text-[10px] text-status-red text-center">
              Something went wrong — please try again.
            </p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting'}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-mono text-sm rounded-lg transition-colors min-h-[44px]"
          >
            {status === 'submitting' ? 'Sending…' : 'Request a Brief →'}
          </button>
        </form>
      </FadeIn>
    </section>
  );
}
