'use client';

import dynamic from 'next/dynamic';
import type { MapMode, ScenarioParams } from '@/types';

const IntelMap = dynamic(() => import('./IntelMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[clamp(350px,55vh,600px)] sm:h-[600px] lg:h-[75vh] lg:max-h-[900px] w-full rounded-xl bg-bg-card border border-border flex items-center justify-center">
      <div className="text-text-muted font-mono text-xs uppercase tracking-widest">
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
