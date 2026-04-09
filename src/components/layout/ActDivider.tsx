'use client';

import { useElementScrollProgress } from '@/hooks/useElementScrollProgress';

interface ActDividerProps {
  number: string;
  question: string;
  hook: string;
  gradientFrom: string;
  gradientTo: string;
}

export function ActDivider({ number, question, hook, gradientFrom, gradientTo }: ActDividerProps) {
  const { ref, progress, isInView } = useElementScrollProgress<HTMLDivElement>();

  const bgOffset = (progress - 0.5) * -30;

  return (
    <div
      ref={ref}
      className="relative min-h-[30vh] sm:min-h-[30vh] flex items-center justify-center overflow-hidden my-4"
      style={{
        background: `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`,
        transform: `translateY(${bgOffset}px)`,
      }}
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${gradientTo}, transparent)`, opacity: 0.3 }} />
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${gradientTo}, transparent)`, opacity: 0.3 }} />

      <section
        className="text-center px-6 max-w-xl mx-auto"
        style={{
          opacity: isInView ? 1 : 0,
          transform: isInView ? 'translateY(0)' : 'translateY(20px)',
          transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
        }}
        aria-label={`Act ${number}: ${question}`}
      >
        {/* Watermark number — absolute positioned behind text, not in flow */}
        <div className="relative">
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
            aria-hidden="true"
          >
            <span className="font-mono text-[8rem] sm:text-[10rem] md:text-[12rem] font-black text-text-primary/[0.04] leading-none">
              {number}
            </span>
          </div>

          <h2 className="relative text-xl sm:text-2xl md:text-3xl font-bold text-text-primary py-8 sm:py-10 md:py-12 mb-3">
            {question}
          </h2>
        </div>

        <p className="text-sm text-text-secondary max-w-md mx-auto">
          {hook}
        </p>

        <div className="mt-4 text-text-dim animate-bounce [animation-duration:2s]">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="mx-auto" aria-hidden="true">
            <path d="M10 4v12M4 10l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </section>
    </div>
  );
}
