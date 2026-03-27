'use client';

import dynamic from 'next/dynamic';
import type { MapMode, ScenarioParams } from '@/types';

const IntelMap = dynamic(() => import('./IntelMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[600px] lg:h-[700px] w-full rounded-xl bg-[#0a0f1a] border border-[rgba(255,255,255,0.04)] flex items-center justify-center">
      <div className="text-[rgba(255,255,255,0.25)] font-mono text-xs uppercase tracking-widest">
        Initializing MapLibre GL...
      </div>
    </div>
  ),
});

interface MapWrapperProps {
  mapMode: MapMode;
  scenarioParams: ScenarioParams;
  timelinePosition: number;
  onModeChange: (mode: MapMode) => void;
}

export default function MapWrapper(props: MapWrapperProps) {
  return <IntelMap {...props} />;
}
