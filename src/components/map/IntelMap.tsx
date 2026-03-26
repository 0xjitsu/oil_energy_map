'use client';

import { useState, useCallback, useMemo } from 'react';
import Map, { useControl, NavigationControl } from 'react-map-gl/maplibre';
import { MapboxOverlay } from '@deck.gl/mapbox';
import type { MapViewState, Layer } from '@deck.gl/core';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Facility } from '@/types';
import { createFacilityLayer } from './FacilityLayer';
import { createRouteLayers } from './ShippingLayer';
import LayerControls from './LayerControls';
import FacilityDetail from './FacilityDetail';

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

export default function IntelMap() {
  const [layers, setLayers] = useState<LayerVisibility>({
    facilities: true,
    routes: true,
    labels: true,
  });
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(
    null,
  );
  const [hoveredFacility, setHoveredFacility] = useState<string | null>(null);

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
      createFacilityLayer(
        layers.facilities,
        handleSelect,
        hoveredFacility,
        setHoveredFacility,
      ),
      ...createRouteLayers(layers.routes),
    ],
    [layers.facilities, layers.routes, handleSelect, hoveredFacility],
  );

  return (
    <div
      className="relative h-[600px] lg:h-[700px] w-full rounded-xl overflow-hidden border border-[rgba(255,255,255,0.06)]"
      style={{ cursor: hoveredFacility ? 'pointer' : 'grab' }}
    >
      <Map
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={{}}
      >
        <DeckGLOverlay layers={deckLayers} />
        <NavigationControl position="top-left" showCompass={false} />
      </Map>
      <LayerControls layers={layers} onToggle={handleToggle} />
      <FacilityDetail facility={selectedFacility} onClose={handleClose} />
    </div>
  );
}
