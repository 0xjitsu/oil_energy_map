'use client';

import { useEffect, useState, useRef, type RefObject } from 'react';

export function useElementScrollProgress<T extends HTMLElement = HTMLDivElement>(): {
  ref: RefObject<T>;
  progress: number;
  isInView: boolean;
} {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let ticking = false;

    function update() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      if (rect.bottom < 0) {
        setProgress(1);
        setIsInView(false);
        return;
      }
      if (rect.top > windowHeight) {
        setProgress(0);
        setIsInView(false);
        return;
      }

      const totalTravel = windowHeight + rect.height;
      const traveled = windowHeight - rect.top;
      setProgress(Math.max(0, Math.min(1, traveled / totalTravel)));
      setIsInView(true);
    }

    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(() => {
          update();
          ticking = false;
        });
        ticking = true;
      }
    }

    update();

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return { ref, progress, isInView };
}
