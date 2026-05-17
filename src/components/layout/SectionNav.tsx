'use client';

import { useScrollSpy } from '@/hooks/useScrollSpy';
import { BarChart3, Map, TrendingUp, Fuel, SlidersHorizontal, Activity, Building2, type LucideIcon } from 'lucide-react';

interface NavSection {
  id: string;
  label: string;
  icon: LucideIcon;
}

const SECTIONS: NavSection[] = [
  { id: 'snapshot', label: 'Overview', icon: BarChart3 },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'prices', label: 'Prices', icon: TrendingUp },
  { id: 'tracker', label: 'Stations', icon: Fuel },
  { id: 'scenario', label: 'Scenarios', icon: SlidersHorizontal },
  { id: 'stress-test', label: 'Analysis', icon: Activity },
  { id: 'players', label: 'Players', icon: Building2 },
];

const SECTION_IDS = SECTIONS.map((s) => s.id);

export function SectionNav() {
  const activeId = useScrollSpy(SECTION_IDS);

  return (
    <nav
      className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-1"
      aria-label="Section navigation"
    >
      {SECTIONS.map(({ id, label, icon: Icon }) => {
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
            <Icon className="w-3.5 h-3.5" aria-hidden="true" />
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
