'use client';

import { useScrollSpy, type Section } from '@/hooks/useScrollSpy';

const SECTIONS: Section[] = [
  { id: 'snapshot', label: 'Overview', icon: '📊' },
  { id: 'map', label: 'Map', icon: '🗺️' },
  { id: 'prices', label: 'Prices', icon: '💰' },
  { id: 'scenario', label: 'Scenarios', icon: '🎛️' },
  { id: 'stress-test', label: 'Stress Test', icon: '🎲' },
  { id: 'impact', label: 'Impact', icon: '👤' },
  { id: 'players', label: 'Players', icon: '🏢' },
  { id: 'health', label: 'Health', icon: '🩺' },
];

const SECTION_IDS = SECTIONS.map((s) => s.id);

export function SectionNav() {
  const activeId = useScrollSpy(SECTION_IDS);

  return (
    <nav
      className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-1"
      aria-label="Section navigation"
    >
      {SECTIONS.map(({ id, label, icon }) => {
        const isActive = activeId === id;
        return (
          <a
            key={id}
            href={`#${id}`}
            className={`group flex items-center gap-2 px-2 py-1.5 rounded-lg transition-all duration-200 ${
              isActive
                ? 'bg-border-hover text-text-primary'
                : 'text-text-dim hover:text-text-secondary hover:bg-surface-hover'
            }`}
            title={label}
          >
            <span className="text-xs">{icon}</span>
            <span className={`text-[9px] font-mono uppercase tracking-widest transition-all duration-200 ${
              isActive ? 'opacity-100 max-w-[80px]' : 'opacity-0 max-w-0 overflow-hidden group-hover:opacity-100 group-hover:max-w-[80px]'
            }`}>
              {label}
            </span>
          </a>
        );
      })}
    </nav>
  );
}
