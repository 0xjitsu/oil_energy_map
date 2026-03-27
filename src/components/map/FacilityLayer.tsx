import { ScatterplotLayer, ColumnLayer, TextLayer } from '@deck.gl/layers';
import { facilities } from '@/data/facilities';
import type { Facility, MapMode, ScenarioParams } from '@/types';
import type { Layer } from '@deck.gl/core';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

// Visual sizing by facility type — ensures hierarchy is visible at any zoom
const TYPE_RADIUS: Record<string, number> = {
  refinery: 18,  // largest — Petron Bataan dominates
  terminal: 10,
  depot: 6,
};

const ELEVATION_SCALE = 5;

function getElevationMultiplier(
  facility: Facility,
  mapMode: MapMode,
  scenarioParams: ScenarioParams,
): number {
  if (mapMode === 'live') return 1;

  const hormuzFactor = scenarioParams.hormuzWeeks / 16;

  if (facility.id === 'petron-bataan') {
    if (scenarioParams.refineryOffline) return 0.1;
    return 1 - hormuzFactor * 0.3;
  }

  if (facility.type === 'terminal') {
    return 1 + (scenarioParams.refineryOffline ? 0.2 : hormuzFactor * 0.1);
  }

  return 1;
}

function getFacilityAlpha(
  d: Facility,
  mapMode: MapMode,
  scenarioParams: ScenarioParams,
  hoveredId: string | null,
): number {
  let alpha = 220;
  if (d.status === 'closed') alpha = 100;
  else if (d.status === 'upgraded') alpha = 250;
  if (d.id === hoveredId) alpha = Math.min(alpha + 35, 255);
  if (mapMode !== 'live' && d.id === 'petron-bataan' && scenarioParams.refineryOffline) {
    alpha = 60;
  }
  return alpha;
}

export function createFacilityLayers(
  visible: boolean,
  mapMode: MapMode,
  scenarioParams: ScenarioParams,
  timelinePosition: number,
  onSelect: (facility: Facility) => void,
  hoveredId: string | null,
  setHoveredId: (id: string | null) => void,
): Layer[] {
  // Layer 1: Outer glow ring — soft halo behind each point
  const glowLayer = new ScatterplotLayer<Facility>({
    id: 'facility-glow',
    data: facilities,
    visible,
    pickable: false,
    getPosition: (d: Facility) => [d.coordinates[1], d.coordinates[0]],
    getRadius: (d: Facility) => (TYPE_RADIUS[d.type] ?? 8) * 2.5,
    radiusUnits: 'pixels' as const,
    radiusMinPixels: 12,
    radiusMaxPixels: 60,
    getFillColor: (d: Facility) => {
      const rgb = hexToRgb(d.color);
      const alpha = d.id === hoveredId ? 50 : 25;
      return [...rgb, alpha] as [number, number, number, number];
    },
    updateTriggers: {
      getFillColor: [hoveredId],
    },
  });

  // Layer 2: Core dot — always visible, sized by type hierarchy
  const dotLayer = new ScatterplotLayer<Facility>({
    id: 'facility-dots',
    data: facilities,
    visible,
    pickable: true,
    getPosition: (d: Facility) => [d.coordinates[1], d.coordinates[0]],
    getRadius: (d: Facility) => TYPE_RADIUS[d.type] ?? 8,
    radiusUnits: 'pixels' as const,
    radiusMinPixels: 5,
    radiusMaxPixels: 30,
    getFillColor: (d: Facility) => {
      const rgb = hexToRgb(d.color);
      const alpha = getFacilityAlpha(d, mapMode, scenarioParams, hoveredId);
      return [...rgb, alpha] as [number, number, number, number];
    },
    getLineColor: (d: Facility) => {
      const rgb = hexToRgb(d.color);
      return [...rgb, d.id === hoveredId ? 200 : 120] as [number, number, number, number];
    },
    getLineWidth: (d: Facility) => (d.type === 'refinery' ? 2 : 1),
    lineWidthUnits: 'pixels' as const,
    stroked: true,
    onClick: ({ object }: { object?: Facility }) => {
      if (object) onSelect(object);
    },
    onHover: ({ object }: { object?: Facility }) => {
      setHoveredId(object ? object.id : null);
    },
    transitions: {
      getFillColor: 300,
      getRadius: 300,
    },
    updateTriggers: {
      getFillColor: [hoveredId, mapMode, scenarioParams.refineryOffline],
      getLineColor: [hoveredId],
    },
  });

  // Layer 3: Labels — facility names visible on the map
  const labelLayer = new TextLayer<Facility>({
    id: 'facility-labels',
    data: facilities.filter((f) => f.type !== 'depot'), // Only label refineries and terminals
    visible,
    pickable: false,
    getPosition: (d: Facility) => [d.coordinates[1], d.coordinates[0]],
    getText: (d: Facility) => {
      if (d.isPrimary) return 'PETRON BATAAN';
      // Short name: first word of operator + type
      return d.operator.split(' ')[0].toUpperCase();
    },
    getSize: (d: Facility) => (d.isPrimary ? 11 : 9),
    getColor: (d: Facility) => {
      const rgb = hexToRgb(d.color);
      return [...rgb, 180] as [number, number, number, number];
    },
    getPixelOffset: [0, -22] as [number, number],
    fontFamily: 'monospace',
    fontWeight: 700,
    outlineWidth: 3,
    outlineColor: [6, 10, 16, 200],
    background: false,
    billboard: true,
    sizeUnits: 'pixels' as const,
    updateTriggers: {
      getColor: [mapMode, scenarioParams.refineryOffline],
    },
  });

  // Layer 4: 3D columns — only in SCENARIO/TIMELINE modes for dramatic effect
  const columnLayer = new ColumnLayer<Facility>({
    id: 'facility-columns',
    data: facilities,
    visible: visible && mapMode !== 'live',
    pickable: false,
    extruded: true,
    diskResolution: 20,
    radius: 8000,
    getPosition: (d: Facility) => [d.coordinates[1], d.coordinates[0]],
    getElevation: (d: Facility) => {
      const multiplier = getElevationMultiplier(d, mapMode, scenarioParams);
      return d.productionBpd * ELEVATION_SCALE * multiplier;
    },
    getFillColor: (d: Facility) => {
      const rgb = hexToRgb(d.color);
      const alpha = getFacilityAlpha(d, mapMode, scenarioParams, hoveredId);
      return [...rgb, Math.round(alpha * 0.6)] as [number, number, number, number];
    },
    material: { ambient: 0.6, diffuse: 0.8, shininess: 32 },
    transitions: {
      getElevation: 300,
      getFillColor: 300,
    },
    updateTriggers: {
      getFillColor: [hoveredId, mapMode, scenarioParams.refineryOffline],
      getElevation: [mapMode, scenarioParams.hormuzWeeks, scenarioParams.refineryOffline, timelinePosition],
    },
  });

  return [glowLayer, columnLayer, dotLayer, labelLayer];
}
