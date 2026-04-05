'use client';

import { useState, useEffect, useRef } from 'react';

export interface Section {
  id: string;
  label: string;
  icon: string;
}

export function useScrollSpy(sectionIds: string[], offset: number = 100) {
  const [activeId, setActiveId] = useState(sectionIds[0] ?? '');
  const observer = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observer.current?.disconnect();

    observer.current = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: `-${offset}px 0px -60% 0px`, threshold: 0 },
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.current.observe(el);
    }

    return () => observer.current?.disconnect();
  }, [sectionIds, offset]);

  return activeId;
}
