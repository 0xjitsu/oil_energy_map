import { ArcLayer, PathLayer } from '@deck.gl/layers';
import { shippingRoutes } from '@/data/shipping-routes';
import type { ShippingRoute } from '@/types';

function swapCoords(coords: [number, number][]): [number, number][] {
  return coords.map(([lat, lng]) => [lng, lat]);
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

export function createRouteLayers(visible: boolean) {
  const pathLayer = new PathLayer<ShippingRoute>({
    id: 'route-paths',
    data: shippingRoutes,
    visible,
    pickable: true,
    getPath: (d: ShippingRoute) => swapCoords(d.coordinates),
    getColor: (d: ShippingRoute) => {
      const rgb = hexToRgb(d.color);
      const alpha = d.status === 'disrupted' ? 220 : 150;
      return [...rgb, alpha] as [number, number, number, number];
    },
    getWidth: (d: ShippingRoute) => (d.status === 'disrupted' ? 3 : 2),
    widthUnits: 'pixels' as const,
    widthMinPixels: 1,
  });

  const arcLayer = new ArcLayer<ShippingRoute>({
    id: 'route-arcs',
    data: shippingRoutes,
    visible,
    pickable: true,
    getSourcePosition: (d: ShippingRoute) => {
      const first = d.coordinates[0];
      return [first[1], first[0]];
    },
    getTargetPosition: (d: ShippingRoute) => {
      const last = d.coordinates[d.coordinates.length - 1];
      return [last[1], last[0]];
    },
    getSourceColor: (d: ShippingRoute) => {
      const rgb = hexToRgb(d.color);
      return [...rgb, 80] as [number, number, number, number];
    },
    getTargetColor: (d: ShippingRoute) => {
      const rgb = hexToRgb(d.color);
      return [...rgb, 220] as [number, number, number, number];
    },
    getWidth: 2,
    getHeight: 0.3,
    greatCircle: true,
  });

  return [pathLayer, arcLayer];
}
