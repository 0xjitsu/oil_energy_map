'use client';

import { Polyline, Tooltip } from 'react-leaflet';
import { shippingRoutes } from '@/data/shipping-routes';
import type { RouteStatus } from '@/types';

interface ShippingLayerProps {
  visible: boolean;
}

const routeStyle: Record<RouteStatus, { dashArray: string | undefined; weight: number; opacity: number }> = {
  disrupted: { dashArray: '10 6', weight: 2, opacity: 0.8 },
  active: { dashArray: undefined, weight: 2, opacity: 0.6 },
  new: { dashArray: undefined, weight: 3, opacity: 0.7 },
};

const statusLabel: Record<RouteStatus, string> = {
  active: 'Active',
  disrupted: 'Disrupted',
  new: 'New Route',
};

export default function ShippingLayer({ visible }: ShippingLayerProps) {
  if (!visible) return null;

  return (
    <>
      {shippingRoutes.map((route) => {
        const style = routeStyle[route.status];
        return (
          <Polyline
            key={route.id}
            positions={route.coordinates}
            pathOptions={{
              color: route.status === 'disrupted' ? '#ef4444' : route.color,
              weight: style.weight,
              opacity: style.opacity,
              dashArray: style.dashArray,
            }}
          >
            <Tooltip sticky>
              <div className="font-mono text-[10px]">
                <div className="font-bold text-[rgba(255,255,255,0.9)]">{route.label}</div>
                <div className="text-[rgba(255,255,255,0.5)] mt-0.5">
                  Status: {statusLabel[route.status]}
                </div>
              </div>
            </Tooltip>
          </Polyline>
        );
      })}
    </>
  );
}
