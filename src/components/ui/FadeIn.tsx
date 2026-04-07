'use client';

import { useRef, useState, useEffect, type ReactNode } from 'react';

type Phase = 'idle' | 'pending' | 'visible';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, className = '' }: FadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    // Check reduced motion preference
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mql.matches) {
      setPrefersReduced(true);
      setPhase('visible');
      return;
    }

    const el = ref.current;
    if (!el) return;

    // SSR-safe: check if already in viewport on mount
    const rect = el.getBoundingClientRect();
    const inViewport =
      rect.top < window.innerHeight && rect.bottom > 0;

    if (inViewport) {
      // In viewport: apply delay then show
      if (delay > 0) {
        const timer = setTimeout(() => setPhase('visible'), delay);
        return () => clearTimeout(timer);
      }
      setPhase('visible');
      return;
    }

    // Not in viewport: watch for intersection
    setPhase('pending');

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            setTimeout(() => setPhase('visible'), delay);
          } else {
            setPhase('visible');
          }
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  const isVisible = phase === 'visible' || prefersReduced;

  const style: React.CSSProperties = prefersReduced
    ? {}
    : {
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
      };

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  );
}
