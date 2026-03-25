'use client';

import { CircleMarker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useRef } from 'react';
import { facilities } from '@/data/facilities';
import type { Facility, FacilityType } from '@/types';

interface FacilityLayerProps {
  visible: boolean;
  onSelect: (facility: Facility) => void;
}

const radiusByType: Record<FacilityType, number> = {
  refinery: 8,
  terminal: 6,
  depot: 4,
};

function PulsingMarker({ facility }: { facility: Facility }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    const icon = L.divIcon({
      className: '',
      html: `<div class="pulse-marker" style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: ${facility.color};
        opacity: 0.5;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker(facility.coordinates, {
      icon,
      interactive: false,
    });
    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, [map, facility.coordinates, facility.color]);

  return null;
}

export default function FacilityLayer({ visible, onSelect }: FacilityLayerProps) {
  if (!visible) return null;

  return (
    <>
      {facilities.map((facility) => (
        <div key={facility.id}>
          {facility.isPrimary && <PulsingMarker facility={facility} />}
          <CircleMarker
            center={facility.coordinates}
            radius={radiusByType[facility.type]}
            pathOptions={{
              color: facility.color,
              fillColor: facility.color,
              fillOpacity: 0.7,
              weight: 1.5,
              opacity: 0.9,
            }}
            eventHandlers={{
              click: () => onSelect(facility),
            }}
          >
            <Popup>
              <div className="font-mono text-[11px] min-w-[180px]">
                <div className="font-bold text-[rgba(255,255,255,0.9)] text-xs">
                  {facility.name}
                </div>
                <div className="mt-1.5 space-y-1 text-[rgba(255,255,255,0.6)]">
                  <div>
                    <span className="text-[rgba(255,255,255,0.35)]">Operator:</span>{' '}
                    {facility.operator}
                  </div>
                  <div>
                    <span className="text-[rgba(255,255,255,0.35)]">Capacity:</span>{' '}
                    {facility.capacity}
                  </div>
                  <div>
                    <span className="text-[rgba(255,255,255,0.35)]">Status:</span>{' '}
                    <span
                      className={
                        facility.status === 'operational'
                          ? 'text-emerald-400'
                          : facility.status === 'upgraded'
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }
                    >
                      {facility.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        </div>
      ))}
    </>
  );
}
