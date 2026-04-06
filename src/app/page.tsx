'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { AlertBanner } from '@/components/layout/AlertBanner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import MapWrapper from '@/components/map/MapWrapper';
import TimelineSlider from '@/components/map/TimelineSlider';
import { PumpPrices } from '@/components/prices/PumpPrices';
import { ImpactCards } from '@/components/prices/ImpactCards';
import { VitalSigns } from '@/components/health/VitalSigns';
import { SentimentGauge } from '@/components/health/SentimentGauge';
import { EventTimeline } from '@/components/health/EventTimeline';
import { StationTrackerSection } from '@/components/health/StationTrackerSection';
import { ScrollProgress } from '@/components/ui/ScrollProgress';
import { ExecutiveSnapshot } from '@/components/layout/ExecutiveSnapshot';
import { SectionNav } from '@/components/layout/SectionNav';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { CascadeSection } from '@/components/cascade/CascadeSection';
import type { MapMode, ScenarioParams } from '@/types';

const PricePanel = dynamic(
  () => import('@/components/prices/PricePanel').then((m) => m.PricePanel),
  { ssr: false },
);
const ScenarioPlanner = dynamic(
  () => import('@/components/scenarios/ScenarioPlanner').then((m) => m.ScenarioPlanner),
  { ssr: false },
);
const MarketShare = dynamic(
  () => import('@/components/players/MarketShare').then((m) => m.MarketShare),
  { ssr: false },
);
const PlayerCards = dynamic(
  () => import('@/components/players/PlayerCards').then((m) => m.PlayerCards),
  { ssr: false },
);
const ImpactCalculator = dynamic(
  () => import('@/components/consumer/ImpactCalculator').then((m) => m.ImpactCalculator),
  { ssr: false },
);
const StressTest = dynamic(
  () => import('@/components/scenarios/StressTest').then((m) => m.StressTest),
  { ssr: false },
);
const TimelineScrubber = dynamic(
  () => import('@/components/timeline/TimelineScrubber').then((m) => m.TimelineScrubber),
  { ssr: false },
);
const HowToGuide = dynamic(
  () => import('@/components/onboarding/HowToGuide').then((m) => m.HowToGuide),
  { ssr: false },
);

function SectionHeader({
  color,
  label,
}: {
  color: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <h2 className="font-mono text-[10px] uppercase tracking-widest text-text-muted">
        {label}
      </h2>
      <div className="flex-1 h-px bg-border-subtle ml-2" />
    </div>
  );
}

export default function Home() {
  const [mapMode, setMapMode] = useState<MapMode>('live');
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    brentPrice: 106,
    hormuzWeeks: 2,
    forexRate: 58.42,
    refineryOffline: false,
  });
  const [timelinePosition, setTimelinePosition] = useState(0);

  const handleParamsChange = useCallback(setScenarioParams, []);

  return (
    <div className="min-h-screen bg-bg-primary overflow-x-clip">
      <ScrollProgress />
      <AlertBanner />
      <Header />
      <SectionNav />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Executive Snapshot — Hero KPIs */}
        <div id="snapshot" className="scroll-mt-20">
          <ExecutiveSnapshot scenarioParams={scenarioParams} />
        </div>

        {/* Hero: Full-Width Map */}
        <section id="map" className="scroll-mt-20">
          <SectionHeader color="bg-petron" label="Supply Chain Map" />
          <div className="relative">
            <MapWrapper
              mapMode={mapMode}
              scenarioParams={scenarioParams}
              timelinePosition={timelinePosition}
              onModeChange={setMapMode}
            />
            <TimelineSlider
              position={timelinePosition}
              onPositionChange={setTimelinePosition}
              visible={mapMode === 'timeline'}
            />
            <TimelineScrubber visible={mapMode === 'timeline'} />
          </div>
        </section>

        {/* Pump Prices + Impact Cards — 2 columns */}
        <section className="scroll-mt-20 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div>
            <SectionHeader color="bg-status-red" label="Pump Prices" />
            <PumpPrices />
          </div>
          <div>
            <SectionHeader color="bg-phoenix" label="What This Means For You" />
            <ImpactCards scenarioParams={scenarioParams} />
          </div>
        </section>

        {/* Station Tracker */}
        <section id="tracker" className="scroll-mt-20">
          <StationTrackerSection />
        </section>

        {/* Cascade Effects — Second-order impact tracker */}
        <section id="cascade" className="scroll-mt-20">
          <SectionHeader color="bg-status-red" label="Cascade Effects" />
          <CascadeSection />
        </section>

        {/* Price Intelligence — Full-width benchmark grid */}
        <section id="prices" className="scroll-mt-20">
          <SectionHeader color="bg-shell" label="Price Intelligence" />
          <PricePanel />
        </section>

        {/* Scenario Planner */}
        <section id="scenario" className="scroll-mt-20">
          <ScenarioPlanner
            params={scenarioParams}
            onParamsChange={handleParamsChange}
            mapMode={mapMode}
            timelinePosition={timelinePosition}
          />
        </section>

        {/* Monte Carlo Stress Test */}
        <section id="stress-test" className="scroll-mt-20">
          <SectionHeader color="bg-status-yellow" label="Stress Test" />
          <StressTest scenarioParams={scenarioParams} />
        </section>

        {/* Consumer Impact Calculator */}
        <section id="impact" className="scroll-mt-20">
          <SectionHeader color="bg-phoenix" label="Consumer Impact" />
          <ImpactCalculator scenarioParams={scenarioParams} />
        </section>

        {/* Market Players + System Health — 2 column on desktop */}
        <section id="players" className="scroll-mt-20 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div>
            <SectionHeader color="bg-seaoil" label="Market Players" />
            <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
              <MarketShare />
              <PlayerCards />
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <SectionHeader color="bg-status-green" label="System Health" />
              <VitalSigns scenarioParams={scenarioParams} mapMode={mapMode} />
            </div>

            <div>
              <SectionHeader color="bg-shell" label="NLP Sentiment" />
              <SentimentGauge />
            </div>

            <div>
              <SectionHeader color="bg-status-yellow" label="Event Timeline" />
              <EventTimeline />
            </div>
          </div>
        </section>
      </main>

      <MobileBottomNav />
      <HowToGuide />
      <Footer />
    </div>
  );
}
