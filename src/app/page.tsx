import dynamic from "next/dynamic";
import { AlertBanner } from "@/components/layout/AlertBanner";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import MapWrapper from "@/components/map/MapWrapper";
import { PumpPrices } from "@/components/prices/PumpPrices";
import { ImpactCards } from "@/components/prices/ImpactCards";
import { VitalSigns } from "@/components/health/VitalSigns";
import { EventTimeline } from "@/components/health/EventTimeline";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

const PricePanel = dynamic(() => import("@/components/prices/PricePanel").then(m => m.PricePanel), { ssr: false });
const ScenarioPlanner = dynamic(() => import("@/components/scenarios/ScenarioPlanner").then(m => m.ScenarioPlanner), { ssr: false });
const MarketShare = dynamic(() => import("@/components/players/MarketShare").then(m => m.MarketShare), { ssr: false });
const PlayerCards = dynamic(() => import("@/components/players/PlayerCards").then(m => m.PlayerCards), { ssr: false });

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <ScrollProgress />
      <AlertBanner />
      <Header />

      <main className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">
        {/* Hero: Map + Price Sidebar */}
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-petron)]" />
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Supply Chain Map
              </h2>
            </div>
            <MapWrapper />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-[var(--status-red)]" />
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Pump Prices
              </h2>
            </div>
            <PumpPrices />

            <div className="flex items-center gap-2 mt-4 mb-1">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-phoenix)]" />
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                What This Means For You
              </h2>
            </div>
            <ImpactCards />
          </div>
        </section>

        {/* Price Intelligence */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-shell)]" />
            <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
              Price Intelligence
            </h2>
          </div>
          <PricePanel />
        </section>

        {/* Scenario Planner */}
        <section>
          <ScenarioPlanner />
        </section>

        {/* Market Players + System Health */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-seaoil)]" />
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                Market Players
              </h2>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr] gap-4">
              <MarketShare />
              <PlayerCards />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--status-green)]" />
              <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                System Health
              </h2>
            </div>
            <VitalSigns />
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[var(--status-yellow)]" />
                <h2 className="font-mono text-[10px] uppercase tracking-widest text-[var(--text-muted)]">
                  Event Timeline
                </h2>
              </div>
              <EventTimeline />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
