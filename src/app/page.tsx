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
import { ActDivider } from '@/components/layout/ActDivider';

import { CrisisProvider } from '@/lib/CrisisProvider';
import { HighlightProvider } from '@/lib/HighlightContext';
import { FadeIn } from '@/components/ui/FadeIn';
import {
  PricePanelSkeleton,
  ScenarioPlannerSkeleton,
  MarketShareSkeleton,
  PlayerCardsSkeleton,
  ImpactCalculatorSkeleton,
  StressTestSkeleton,
  TimelineScrubberSkeleton,
  HowToGuideSkeleton,
} from '@/components/ui/Skeleton';
import type { MapMode, ScenarioParams } from '@/types';

const PricePanel = dynamic(
  () => import('@/components/prices/PricePanel').then((m) => m.PricePanel),
  { ssr: false, loading: () => <PricePanelSkeleton /> },
);
const ScenarioPlanner = dynamic(
  () => import('@/components/scenarios/ScenarioPlanner').then((m) => m.ScenarioPlanner),
  { ssr: false, loading: () => <ScenarioPlannerSkeleton /> },
);
const MarketShare = dynamic(
  () => import('@/components/players/MarketShare').then((m) => m.MarketShare),
  { ssr: false, loading: () => <MarketShareSkeleton /> },
);
const PlayerCards = dynamic(
  () => import('@/components/players/PlayerCards').then((m) => m.PlayerCards),
  { ssr: false, loading: () => <PlayerCardsSkeleton /> },
);
const ImpactCalculator = dynamic(
  () => import('@/components/consumer/ImpactCalculator').then((m) => m.ImpactCalculator),
  { ssr: false, loading: () => <ImpactCalculatorSkeleton /> },
);
const StressTest = dynamic(
  () => import('@/components/scenarios/StressTest').then((m) => m.StressTest),
  { ssr: false, loading: () => <StressTestSkeleton /> },
);
const TimelineScrubber = dynamic(
  () => import('@/components/timeline/TimelineScrubber').then((m) => m.TimelineScrubber),
  { ssr: false, loading: () => <TimelineScrubberSkeleton /> },
);
const HowToGuide = dynamic(
  () => import('@/components/onboarding/HowToGuide').then((m) => m.HowToGuide),
  { ssr: false, loading: () => <HowToGuideSkeleton /> },
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
    <CrisisProvider scenarioParams={scenarioParams}>
      <div className="min-h-screen bg-bg-primary overflow-x-clip">
      <ScrollProgress />
      <AlertBanner />
      <Header />
      <SectionNav />

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* ━━━ ACT 1: WHAT'S HAPPENING NOW ━━━ */}
        <ActDivider
          number="01"
          question="What's Happening Now"
          hook="Live supply chain status — crude benchmarks, forex, pump prices, and the infrastructure that moves oil across the Philippines."
          gradientFrom="#060a10"
          gradientTo="#0a1628"
        />

        {/* Executive Snapshot — Hero KPIs */}
        <FadeIn delay={0}>
          <div id="snapshot" className="scroll-mt-24">
            <ExecutiveSnapshot scenarioParams={scenarioParams} />
          </div>
        </FadeIn>

        {/* Hero: Full-Width Map */}
        <FadeIn delay={100}>
        <section id="map" className="scroll-mt-24">
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
        </FadeIn>

        {/* ━━━ ACT 2: WHAT IT COSTS ━━━ */}
        <ActDivider
          number="02"
          question="What does it cost you?"
          hook="The supply chain above sets the stage. Now let's see what it means at the pump — and in your wallet."
          gradientFrom="#0a1628"
          gradientTo="#1e1b4b"
        />

        {/* Pump Prices + Impact Cards — 2 columns */}
        <section className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div>
            <SectionHeader color="bg-status-red" label="Pump Prices" />
            <PumpPrices />
          </div>
          <div>
            <SectionHeader color="bg-phoenix" label="What This Means For You" />
            <ImpactCards scenarioParams={scenarioParams} />
          </div>
        </section>

        {/* Price Intelligence — Full-width benchmark grid */}
        <section id="prices" className="scroll-mt-24">
          <SectionHeader color="bg-shell" label="Price Intelligence" />
          <PricePanel />
        </section>

        {/* Station Tracker */}
        <section id="tracker" className="scroll-mt-24">
          <StationTrackerSection />
        </section>

        {/* ━━━ ACT 3: WHAT-IF ANALYSIS ━━━ */}
        <ActDivider
          number="03"
          question="What could happen next?"
          hook="Prices are one thing. But what if Hormuz closes for 8 weeks? Model the scenarios yourself."
          gradientFrom="#1e1b4b"
          gradientTo="#1c1408"
        />

        {/* Scenario Planner */}
        <section id="scenario" className="scroll-mt-24">
          <ScenarioPlanner
            params={scenarioParams}
            onParamsChange={handleParamsChange}
            mapMode={mapMode}
            timelinePosition={timelinePosition}
          />
        </section>

        {/* Stress Test + Consumer Impact — 2 columns */}
        <section id="stress-test" className="scroll-mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 lg:gap-6">
          <div>
            <SectionHeader color="bg-status-yellow" label="Stress Test" />
            <StressTest scenarioParams={scenarioParams} />
          </div>
          <div>
            <SectionHeader color="bg-phoenix" label="Consumer Impact" />
            <ImpactCalculator scenarioParams={scenarioParams} />
          </div>
        </section>

        {/* ━━━ ACT 4: WHO'S INVOLVED ━━━ */}
        <ActDivider
          number="04"
          question="Who controls the supply?"
          hook="Behind every price movement are market players, system health indicators, and global events."
          gradientFrom="#1c1408"
          gradientTo="#0f172a"
        />

        {/* Market Players — full width with donut + cards side by side */}
        <section id="players" className="scroll-mt-24">
          <SectionHeader color="bg-seaoil" label="Market Players" />
          <HighlightProvider>
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
              <MarketShare />
              <PlayerCards />
            </div>
          </HighlightProvider>
        </section>

        {/* System Health + Sentiment — 2 column */}
        <section className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div>
            <SectionHeader color="bg-status-green" label="System Health" />
            <VitalSigns scenarioParams={scenarioParams} mapMode={mapMode} />
          </div>
          <div>
            <SectionHeader color="bg-shell" label="NLP Sentiment" />
            <SentimentGauge />
          </div>
        </section>

        {/* Event Timeline — full width */}
        <section className="scroll-mt-24">
          <SectionHeader color="bg-status-yellow" label="Event Timeline" />
          <EventTimeline />
        </section>
      </main>

      <MobileBottomNav />
      <HowToGuide />
      <Footer />
      </div>
    </CrisisProvider>
  );
}
