import { ScatterplotLayer } from '@deck.gl/layers';
import { facilities } from '@/data/facilities';
import type { Facility, FacilityType } from '@/types';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

const TYPE_RADIUS: Record<FacilityType, number> = {
  refinery: 10000,
  terminal: 6000,
  depot: 3500,
};

export function createFacilityLayer(
  visible: boolean,
  onSelect: (facility: Facility) => void,
  hoveredId: string | null,
  setHoveredId: (id: string | null) => void,
) {
  return new ScatterplotLayer<Facility>({
    id: 'facilities',
    data: facilities,
    visible,
    pickable: true,
    filled: true,
    stroked: true,
    getPosition: (d: Facility) => [d.coordinates[1], d.coordinates[0]],
    getRadius: (d: Facility) => {
      const base = TYPE_RADIUS[d.type] ?? 3500;
      if (d.isPrimary) return base * 1.4;
      if (d.id === hoveredId) return base * 1.2;
      return base;
    },
    getFillColor: (d: Facility) => {
      const rgb = hexToRgb(d.color);
      const alpha =
        d.id === hoveredId ? 255 : d.status === 'closed' ? 80 : 200;
      return [...rgb, alpha] as [number, number, number, number];
    },
    getLineColor: (d: Facility) => {
      const rgb = hexToRgb(d.color);
      return [...rgb, d.isPrimary ? 255 : 100] as [
        number,
        number,
        number,
        number,
      ];
    },
    getLineWidth: (d: Facility) => (d.isPrimary ? 3 : 1),
    lineWidthUnits: 'pixels' as const,
    radiusUnits: 'meters' as const,
    radiusMinPixels: 4,
    radiusMaxPixels: 30,
    onClick: ({ object }: { object?: Facility }) => {
      if (object) onSelect(object);
    },
    onHover: ({ object }: { object?: Facility }) => {
      setHoveredId(object ? object.id : null);
    },
    transitions: {
      getRadius: 300,
      getFillColor: 300,
    },
    updateTriggers: {
      getFillColor: hoveredId,
      getRadius: hoveredId,
    },
  });
}
