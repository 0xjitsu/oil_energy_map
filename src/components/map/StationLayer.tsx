import { ScatterplotLayer } from '@deck.gl/layers';
import { allStations } from '@/data/stations';
import type { GasStation } from '@/types/stations';
import { BRAND_COLORS } from '@/types/stations';
import type { Layer } from '@deck.gl/core';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function createStationLayer(
  visible: boolean,
  visibleBrands: Set<string>,
  onSelect: (station: GasStation) => void,
  hoveredId: string | null,
  setHoveredId: (id: string | null) => void,
): Layer[] {
  const filtered = allStations.filter((s) => visibleBrands.has(s.brand));

  const dotLayer = new ScatterplotLayer<GasStation>({
    id: 'station-dots',
    data: filtered,
    visible,
    pickable: true,
    getPosition: (d: GasStation) => [d.coordinates[1], d.coordinates[0]],
    getRadius: (d: GasStation) => (d.id === hoveredId ? 6 : 4),
    radiusUnits: 'pixels' as const,
    radiusMinPixels: 2,
    radiusMaxPixels: 8,
    getFillColor: (d: GasStation) => {
      const rgb = hexToRgb(BRAND_COLORS[d.brand] ?? BRAND_COLORS.Other);
      const alpha = d.id === hoveredId ? 255 : 180;
      return [...rgb, alpha] as [number, number, number, number];
    },
    onClick: ({ object }: { object?: GasStation }) => {
      if (object) onSelect(object);
    },
    onHover: ({ object }: { object?: GasStation }) => {
      setHoveredId(object ? object.id : null);
    },
    transitions: {
      getFillColor: 300,
      getRadius: 300,
    },
    updateTriggers: {
      getFillColor: [hoveredId],
      getRadius: [hoveredId],
      data: [visibleBrands],
    },
  });

  return [dotLayer];
}
