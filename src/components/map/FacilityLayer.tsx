import { ColumnLayer } from '@deck.gl/layers';
import { facilities } from '@/data/facilities';
import type { Facility, MapMode, ScenarioParams } from '@/types';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

const ELEVATION_SCALE = 50; // multiplier for productionBpd → visual height

function getElevationMultiplier(
  facility: Facility,
  mapMode: MapMode,
  scenarioParams: ScenarioParams,
): number {
  if (mapMode === 'live') return 1;

  const hormuzFactor = scenarioParams.hormuzWeeks / 16;

  if (facility.id === 'petron-bataan') {
    if (scenarioParams.refineryOffline) return 0.1;
    return 1 - hormuzFactor * 0.3; // shrinks as supply disrupted
  }

  if (facility.type === 'terminal') {
    // Terminals grow slightly as import dependency increases
    return 1 + (scenarioParams.refineryOffline ? 0.2 : hormuzFactor * 0.1);
  }

  return 1;
}

export function createFacilityLayer(
  visible: boolean,
  mapMode: MapMode,
  scenarioParams: ScenarioParams,
  timelinePosition: number,
  onSelect: (facility: Facility) => void,
  hoveredId: string | null,
  setHoveredId: (id: string | null) => void,
) {
  return new ColumnLayer<Facility>({
    id: 'facilities',
    data: facilities,
    visible,
    pickable: true,
    extruded: true,
    diskResolution: 20,
    radius: 30000,
    getPosition: (d: Facility) => [d.coordinates[1], d.coordinates[0]],
    getElevation: (d: Facility) => {
      const multiplier = getElevationMultiplier(d, mapMode, scenarioParams);
      return d.productionBpd * ELEVATION_SCALE * multiplier;
    },
    getFillColor: (d: Facility) => {
      const rgb = hexToRgb(d.color);
      let alpha = 200;
      if (d.status === 'closed') alpha = 80;
      else if (d.status === 'upgraded') alpha = 240;
      if (d.id === hoveredId) alpha = Math.min(alpha + 55, 255);

      // In SCENARIO mode, dim Petron if offline
      if (mapMode !== 'live' && d.id === 'petron-bataan' && scenarioParams.refineryOffline) {
        alpha = 50;
      }

      return [...rgb, alpha] as [number, number, number, number];
    },
    material: { ambient: 0.6, diffuse: 0.8, shininess: 32 },
    onClick: ({ object }: { object?: Facility }) => {
      if (object) onSelect(object);
    },
    onHover: ({ object }: { object?: Facility }) => {
      setHoveredId(object ? object.id : null);
    },
    transitions: {
      getElevation: 300,
      getFillColor: 300,
    },
    updateTriggers: {
      getFillColor: [hoveredId, mapMode, scenarioParams.refineryOffline],
      getElevation: [mapMode, scenarioParams.hormuzWeeks, scenarioParams.refineryOffline, timelinePosition],
    },
  });
}
