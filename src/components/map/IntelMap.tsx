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
import LayerControls from './LayerControls';
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
      <LayerControls
        layers={layers}
        onToggle={handleToggle}
        mapMode={mapMode}
        onModeChange={onModeChange}
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
      />
      <FacilityDetail facility={selectedFacility} onClose={handleClose} />
      {hoveredStationInfo && (
        <StationTooltip
          station={hoveredStationInfo.station}
          x={hoveredStationInfo.x}
          y={hoveredStationInfo.y}
        />
      )}
    </div>
  );
}
