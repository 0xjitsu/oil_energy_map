import { ArcLayer } from '@deck.gl/layers';
import { TripsLayer } from '@deck.gl/geo-layers';
import { shippingRoutes } from '@/data/shipping-routes';
import type { ShippingRoute, MapMode, ScenarioParams } from '@/types';

function swapCoords(coords: [number, number][]): [number, number][] {
  return coords.map(([lat, lng]) => [lng, lat]);
}

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

function getRouteOpacity(
  route: ShippingRoute,
  mapMode: MapMode,
  scenarioParams: ScenarioParams,
): number {
  if (mapMode === 'live') {
    return route.status === 'disrupted' ? 220 : 180;
  }
  // SCENARIO and TIMELINE modes
  if (route.id === 'hormuz') {
    const disruption = scenarioParams.hormuzWeeks / 16; // 0 to 1
    return Math.round(220 * (1 - disruption * 0.8)); // dims to 20% at max disruption
  }
  return 200;
}

export function createRouteLayers(
  visible: boolean,
  mapMode: MapMode,
  currentTime: number,
  scenarioParams: ScenarioParams,
) {
  const tripsLayer = new TripsLayer<ShippingRoute>({
    id: 'tanker-trips',
    data: shippingRoutes,
    visible,
    getPath: (d: ShippingRoute) => swapCoords(d.coordinates),
    getTimestamps: (d: ShippingRoute) => d.timestamps,
    getColor: (d: ShippingRoute) => {
      const rgb = hexToRgb(d.color);
      const alpha = getRouteOpacity(d, mapMode, scenarioParams);
      return [...rgb, alpha] as [number, number, number, number];
    },
    opacity: 0.9,
    widthMinPixels: 6,
    trailLength: 200,
    currentTime,
  });

  const arcLayer = new ArcLayer<ShippingRoute>({
    id: 'route-arcs',
    data: shippingRoutes,
    visible,
    pickable: false,
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
      return [...rgb, 90] as [number, number, number, number];
    },
    getTargetColor: (d: ShippingRoute) => {
      const rgb = hexToRgb(d.color);
      return [...rgb, 60] as [number, number, number, number];
    },
    getWidth: 2,
    getHeight: 0.3,
    greatCircle: true,
  });

  return [tripsLayer, arcLayer];
}
