// src/components/services/BeforeAfter.tsx
'use client';

import { beforeAfterItems } from '@/data/services';
import { FadeIn } from '@/components/ui/FadeIn';

export function BeforeAfter() {
  return (
    <section className="py-20 px-4 max-w-5xl mx-auto">
      <FadeIn>
        <p className="font-mono text-[10px] uppercase tracking-widest text-text-label text-center mb-4">
          THE PROBLEM
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-text-primary text-center mb-12">
          Your bid window is 2 weeks.
          <br />
          <span className="text-status-red">Manual encoding takes 4–6.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <div className="glass-card p-6 border-l-2 border-red-500">
            <p className="font-mono text-[10px] uppercase tracking-widest text-status-red mb-4">
              BEFORE (MANUAL)
            </p>
            <ul className="space-y-3 mb-6" aria-label="Manual process steps">
              {beforeAfterItems.before.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="text-status-red flex-shrink-0 mt-0.5" aria-hidden="true">✗</span>
                  <span className="text-text-body text-sm">{item}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border-subtle pt-4">
              <div className="font-mono text-3xl font-bold text-status-red">
                {beforeAfterItems.beforeStat}
              </div>
              <div className="text-text-dim text-xs mt-1">{beforeAfterItems.beforeStatSub}</div>
              <span className="mt-3 inline-block px-2 py-1 bg-red-500/10 text-red-400 font-mono text-[10px] rounded">
                {beforeAfterItems.beforeBadge}
              </span>
            </div>
          </div>

          {/* After */}
          <div className="glass-card p-6 border-l-2 border-green-500">
            <p className="font-mono text-[10px] uppercase tracking-widest text-status-green mb-4">
              AFTER (PLATFORM)
            </p>
            <ul className="space-y-3 mb-6" aria-label="Platform process steps">
              {beforeAfterItems.after.map((item) => (
                <li key={item.text} className="flex items-center gap-3">
                  <span className="text-status-green flex-shrink-0" aria-hidden="true">✓</span>
                  <span className="text-text-body text-sm flex-1">{item.text}</span>
                  {item.badge !== null && (
                    <span
                      className={`px-2 py-0.5 rounded font-mono text-[9px] uppercase flex-shrink-0 ${
                        item.badge === 'human'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-green-500/10 text-green-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <div className="border-t border-border-subtle pt-4">
              <div className="font-mono text-3xl font-bold text-status-green">
                {beforeAfterItems.afterStat}
              </div>
              <div className="text-text-dim text-xs mt-1">{beforeAfterItems.afterStatSub}</div>
              <span className="mt-3 inline-block px-2 py-1 bg-green-500/10 text-green-400 font-mono text-[10px] rounded">
                {beforeAfterItems.afterBadge}
              </span>
            </div>
          </div>
        </div>
      </FadeIn>
    </section>
  );
}
