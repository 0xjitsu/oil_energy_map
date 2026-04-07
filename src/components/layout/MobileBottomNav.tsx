'use client';

import { useScrollSpy } from '@/hooks/useScrollSpy';

const MOBILE_SECTIONS = [
  { id: 'snapshot', label: 'Home', icon: '📊' },
  { id: 'map', label: 'Map', icon: '🗺️' },
  { id: 'prices', label: 'Prices', icon: '💰' },
  { id: 'scenario', label: 'Plan', icon: '🎛️' },
  { id: 'players', label: 'Market', icon: '🏢' },
];

const MOBILE_SECTION_IDS = MOBILE_SECTIONS.map((s) => s.id);

export function MobileBottomNav() {
  const activeId = useScrollSpy(MOBILE_SECTION_IDS);

  return (
    <nav
      className="xl:hidden fixed bottom-0 left-0 right-0 z-50 glass-card border-t border-border-subtle rounded-none safe-area-bottom"
      aria-label="Quick navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
        {MOBILE_SECTIONS.map(({ id, label, icon }) => {
          const isActive = activeId === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[56px] min-h-[44px] transition-colors ${
                isActive ? 'text-text-primary' : 'text-text-dim'
              }`}
            >
              <span className="text-base">{icon}</span>
              <span className="text-[8px] font-mono uppercase tracking-widest">{label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
