'use client';
import { useFadeIn } from '@/hooks/useFadeIn';
import { ReactNode } from 'react';

export function FadeSection({ children, className = '' }: { children: ReactNode; className?: string }) {
  const { ref, isVisible, hasMounted } = useFadeIn();
  const stateClass = !hasMounted ? '' : isVisible ? 'visible' : 'pending';
  return (
    <div ref={ref} className={`fade-in-section ${stateClass} ${className}`}>
      {children}
    </div>
  );
}
