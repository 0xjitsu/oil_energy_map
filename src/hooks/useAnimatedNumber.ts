'use client';
import { useState, useEffect, useRef } from 'react';

export function useAnimatedNumber(target: number, duration: number = 800): number {
  const [value, setValue] = useState(target);
  const prevTarget = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevTarget.current;
    const diff = target - start;
    if (Math.abs(diff) < 0.01) {
      setValue(target);
      prevTarget.current = target;
      return;
    }

    const startTime = performance.now();

    function animate(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(start + diff * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevTarget.current = target;
      }
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return value;
}
