'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Map, { useControl, NavigationControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { MapViewState, Layer } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Facility, MapMode, ScenarioParams } from '@/types';
import type { GasStation } from '@/types/stations';
import { createFacilityLayers } from './FacilityLayer';
import { createRouteLayers } from './ShippingLayer';
import { createStationLayer } from './StationLayer';
import { BRAND_LIST } from '@/data/stations';
import MapToolbar from './MapToolbar';
import CommandPalette from './CommandPalette';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import RegionPanel from './RegionPanel';
import FacilityDetail from './FacilityDetail';
import StationTooltip from './StationTooltip';

function DeckGLOverlay(props: { layers: Layer[] }) {
  const overlay = useControl(() => new MapboxOverlay({ layers: [] }));
  overlay.setProps({ layers: props.layers });
  return null;
}

interface LayerVisibility {
  facilities: boolean;
  routes: boolean;
  labels: boolean;
}

const INITIAL_VIEW_STATE: MapViewState = {
  longitude: 122,
  latitude: 12,
  zoom: 5.5,
  pitch: 30,
  bearing: 0,
};

const MAP_STYLE =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';

export interface IntelMapProps {
  mapMode: MapMode;
  scenarioParams: ScenarioParams;
  timelinePosition: number;
  onModeChange: (mode: MapMode) => void;
}

export default function IntelMap({
  mapMode,
  scenarioParams,
  timelinePosition,
  onModeChange,
}: IntelMapProps) {
  const [layers, setLayers] = useState<LayerVisibility>({
    facilities: true,
    routes: true,
    labels: true,
  });
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [hoveredFacility, setHoveredFacility] = useState<string | null>(null);
  const [stationsVisible, setStationsVisible] = useState(true);
  const [visibleBrands, setVisibleBrands] = useState<Set<string>>(new Set(BRAND_LIST));
  const [hoveredStation, setHoveredStation] = useState<string | null>(null);
  const [hoveredStationInfo, setHoveredStationInfo] = useState<{
    station: GasStation;
    x: number;
    y: number;
  } | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [currentZoom, setCurrentZoom] = useState(INITIAL_VIEW_STATE.zoom);
  const [currentTime, setCurrentTime] = useState(0);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const rafRef = useRef<number>(0);

  // Animation loop for LIVE mode
  useEffect(() => {
    if (mapMode !== 'live') {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const animate = () => {
      setCurrentTime((t) => (t + 1) % 1000);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [mapMode]);

  // In TIMELINE mode, currentTime is driven by timelinePosition
  const effectiveTime = mapMode === 'timeline' ? timelinePosition : currentTime;

  const handleToggle = useCallback((layer: string) => {
    setLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer as keyof LayerVisibility],
    }));
  }, []);

  useKeyboardShortcuts(
    useMemo(
      () => ({
        'I': () => handleToggle('facilities'),
        'S': () => setStationsVisible((v) => !v),
        'R': () => handleToggle('routes'),
        'L': () => handleToggle('labels'),
        '⌘K': () => setCommandPaletteOpen(true),
      }),
      [handleToggle],
    ),
  );

  const handleSelect = useCallback((facility: Facility) => {
    setSelectedFacility(facility);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedFacility(null);
  }, []);

  const deckLayers = useMemo(
    () => [
      ...createFacilityLayers(
        layers.facilities,
        mapMode,
        scenarioParams,
        timelinePosition,
        handleSelect,
        hoveredFacility,
        setHoveredFacility,
      ),
      ...createRouteLayers(layers.routes, mapMode, effectiveTime, scenarioParams),
      ...createStationLayer(
        stationsVisible,
        visibleBrands,
        () => {
          /* future: station detail panel */
        },
        hoveredStation,
        setHoveredStation,
        setHoveredStationInfo,
        currentZoom,
        selectedRegion,
      ),
    ],
    [
      layers.facilities,
      layers.routes,
      mapMode,
      scenarioParams,
      timelinePosition,
      effectiveTime,
      handleSelect,
      hoveredFacility,
      stationsVisible,
      visibleBrands,
      hoveredStation,
      currentZoom,
      selectedRegion,
    ],
  );

  return (
    <div
      className="relative h-[600px] lg:h-[700px] w-full rounded-xl overflow-hidden border border-border-subtle"
      style={{ cursor: hoveredFacility || hoveredStation ? 'pointer' : 'grab' }}
    >
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{}}
        onMove={(evt) => setCurrentZoom(evt.viewState.zoom)}
      >
        <DeckGLOverlay layers={deckLayers} />
        <NavigationControl position="top-left" showCompass={false} />
      </Map>
      {/* Mode tabs — floating center top */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 glass-card p-0.5 flex gap-0.5 rounded-lg">
        {(['live', 'scenario', 'timeline'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={`px-3 py-1.5 rounded-md transition-all duration-200 font-mono text-[9px] uppercase tracking-widest ${
              mapMode === mode
                ? 'text-text-primary bg-border-hover'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      <MapToolbar
        layers={layers}
        onToggle={handleToggle}
        stationsVisible={stationsVisible}
        onStationsToggle={() => setStationsVisible((v) => !v)}
        visibleBrands={visibleBrands}
        onBrandToggle={(brand: string) => {
          setVisibleBrands((prev) => {
            const next = new Set(prev);
            if (next.has(brand)) next.delete(brand);
            else next.add(brand);
            return next;
          });
        }}
        selectedRegion={selectedRegion}
        onRegionChange={setSelectedRegion}
        onCommandPalette={() => setCommandPaletteOpen(true)}
      />

      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onToggleLayer={(layer) => {
          if (layer === 'stations') setStationsVisible((v) => !v);
          else handleToggle(layer);
        }}
      />
      <FacilityDetail facility={selectedFacility} onClose={handleClose} />
      {hoveredStationInfo && (
        <StationTooltip
          station={hoveredStationInfo.station}
          x={hoveredStationInfo.x}
          y={hoveredStationInfo.y}
        />
      )}
      {selectedRegion && (
        <RegionPanel
          region={selectedRegion}
          onClose={() => setSelectedRegion(null)}
        />
      )}
    </div>
  );
}
