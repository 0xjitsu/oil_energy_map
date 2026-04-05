import { ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { allStations } from '@/data/stations';
import type { GasStation } from '@/types/stations';
import { BRAND_COLORS, STATUS_COLORS } from '@/types/stations';
import type { StationStatus } from '@/types/stations';
import type { Layer } from '@deck.gl/core';
import Supercluster from 'supercluster';
import type { PointFeature } from 'supercluster';

function hexToRgb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/** Zoom threshold: below this, stations are clustered */
const CLUSTER_MAX_ZOOM = 8;

/** Supercluster index — cached per visible-brands key to avoid rebuilding every frame */
let cachedBrandsKey = '';
let cachedIndex: Supercluster<GasStation> | null = null;

function getClusterIndex(filtered: GasStation[], brandsKey: string): Supercluster<GasStation> {
  if (cachedIndex && cachedBrandsKey === brandsKey) return cachedIndex;

  const index = new Supercluster<GasStation>({
    radius: 60,
    maxZoom: CLUSTER_MAX_ZOOM,
  });

  const features: PointFeature<GasStation>[] = filtered.map((s) => ({
    type: 'Feature' as const,
    geometry: {
      type: 'Point' as const,
      coordinates: [s.coordinates[1], s.coordinates[0]],
    },
    properties: s,
  }));

  index.load(features);
  cachedBrandsKey = brandsKey;
  cachedIndex = index;
  return index;
}

interface ClusterPoint {
  id: string;
  coordinates: [number, number]; // [lng, lat]
  count: number;
  isCluster: boolean;
}

export function createStationLayer(
  visible: boolean,
  visibleBrands: Set<string>,
  onSelect: (station: GasStation) => void,
  hoveredId: string | null,
  setHoveredId: (id: string | null) => void,
  onHoverInfo?: (info: { station: GasStation; x: number; y: number } | null) => void,
  zoom?: number,
  selectedRegion?: string | null,
  statusFilter?: StationStatus | 'all',
): Layer[] {
  const filtered = allStations.filter(
    (s) =>
      visibleBrands.has(s.brand) &&
      (!selectedRegion || s.region === selectedRegion) &&
      (!statusFilter || statusFilter === 'all' || s.status === statusFilter),
  );
  const currentZoom = zoom ?? 10; // default to unclustered if zoom not provided

  // When zoomed in enough, render individual dots (original behavior)
  if (currentZoom >= CLUSTER_MAX_ZOOM) {
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
        const colorSource = statusFilter && statusFilter !== 'all'
          ? STATUS_COLORS[d.status ?? 'operational']
          : (BRAND_COLORS[d.brand] ?? BRAND_COLORS.Other);
        const rgb = hexToRgb(colorSource);
        const alpha = d.id === hoveredId ? 255 : 180;
        return [...rgb, alpha] as [number, number, number, number];
      },
      onClick: ({ object }: { object?: GasStation }) => {
        if (object) onSelect(object);
      },
      onHover: ({ object, x, y }: { object?: GasStation; x: number; y: number }) => {
        setHoveredId(object ? object.id : null);
        onHoverInfo?.(object ? { station: object, x, y } : null);
      },
      transitions: {
        getFillColor: 300,
        getRadius: 300,
      },
      updateTriggers: {
        getFillColor: [hoveredId, statusFilter],
        getRadius: [hoveredId],
        data: [visibleBrands, selectedRegion, statusFilter],
      },
    });
    return [dotLayer];
  }

  // Clustered view for low zoom levels
  const brandsKey = Array.from(visibleBrands).sort().join(',') + '|' + (selectedRegion ?? '') + '|' + (statusFilter ?? 'all');
  const index = getClusterIndex(filtered, brandsKey);
  const rawClusters = index.getClusters([-180, -85, 180, 85], Math.floor(currentZoom));

  const clusterData: ClusterPoint[] = rawClusters.map((c) => {
    const props = c.properties as Record<string, unknown>;
    const isCluster = props.cluster === true;
    return {
      id: isCluster
        ? `cluster-${props.cluster_id}`
        : (props as unknown as GasStation).id,
      coordinates: c.geometry.coordinates as [number, number],
      count: isCluster ? ((props.point_count as number) ?? 1) : 1,
      isCluster,
    };
  });

  const hoveredClusterId = hoveredId;

  // Cluster circle layer
  const clusterCircleLayer = new ScatterplotLayer<ClusterPoint>({
    id: 'station-clusters',
    data: clusterData,
    visible,
    pickable: true,
    getPosition: (d) => d.coordinates,
    getRadius: (d) => {
      const base = d.isCluster
        ? Math.min(Math.max(Math.sqrt(d.count) * 3, 12), 40)
        : 4;
      return d.id === hoveredClusterId ? base * 1.2 : base;
    },
    radiusUnits: 'pixels' as const,
    radiusMinPixels: 3,
    radiusMaxPixels: 50,
    getFillColor: (d) => {
      if (!d.isCluster) {
        // Single unclustered station — fall back to neutral dot
        return d.id === hoveredClusterId
          ? [59, 130, 246, 255] as [number, number, number, number]
          : [59, 130, 246, 160] as [number, number, number, number];
      }
      return d.id === hoveredClusterId
        ? [59, 130, 246, 230] as [number, number, number, number]
        : [59, 130, 246, 160] as [number, number, number, number];
    },
    onHover: ({ object }: { object?: ClusterPoint }) => {
      setHoveredId(object ? object.id : null);
      // Clear station tooltip when hovering clusters
      onHoverInfo?.(null);
    },
    onClick: () => {
      // Future: zoom into cluster on click
    },
    transitions: {
      getFillColor: 300,
      getRadius: 300,
    },
    updateTriggers: {
      getFillColor: [hoveredClusterId],
      getRadius: [hoveredClusterId],
      data: [brandsKey, currentZoom],
    },
  });

  // Only show count labels on actual clusters (count > 1)
  const labelData = clusterData.filter((d) => d.isCluster && d.count > 1);

  const clusterLabelLayer = new TextLayer<ClusterPoint>({
    id: 'station-cluster-labels',
    data: labelData,
    visible,
    pickable: false,
    getPosition: (d) => d.coordinates,
    getText: (d) => (d.count >= 1000 ? `${(d.count / 1000).toFixed(1)}k` : String(d.count)),
    getSize: (d) => (d.count > 100 ? 14 : 12),
    getColor: [255, 255, 255, 255],
    getTextAnchor: 'middle' as const,
    getAlignmentBaseline: 'center' as const,
    fontWeight: 700,
    fontFamily: 'Inter, system-ui, sans-serif',
    sizeUnits: 'pixels' as const,
    updateTriggers: {
      data: [brandsKey, currentZoom],
    },
  });

  return [clusterCircleLayer, clusterLabelLayer];
}
