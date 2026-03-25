'use client';

import { useState } from 'react';
import { MapContainer, TileLayer } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Facility } from '@/types';
import FacilityLayer from './FacilityLayer';
import ShippingLayer from './ShippingLayer';
import LayerControls from './LayerControls';
import FacilityDetail from './FacilityDetail';

interface LayerVisibility {
  facilities: boolean;
  routes: boolean;
  labels: boolean;
}

export default function IntelMap() {
  const [layers, setLayers] = useState<LayerVisibility>({
    facilities: true,
    routes: true,
    labels: true,
  });
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  const handleToggle = (layer: string) => {
    setLayers((prev) => ({
      ...prev,
      [layer]: !prev[layer as keyof LayerVisibility],
    }));
  };

  const handleSelect = (facility: Facility) => {
    setSelectedFacility(facility);
  };

  const handleClose = () => {
    setSelectedFacility(null);
  };

  return (
    <div className="relative h-[600px] lg:h-[700px] w-full rounded-xl overflow-hidden border border-[rgba(255,255,255,0.04)]">
      <MapContainer
        center={[12, 122]}
        zoom={5.5}
        className="h-full w-full"
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FacilityLayer visible={layers.facilities} onSelect={handleSelect} />
        <ShippingLayer visible={layers.routes} />
      </MapContainer>
      <LayerControls layers={layers} onToggle={handleToggle} />
      <FacilityDetail facility={selectedFacility} onClose={handleClose} />
    </div>
  );
}
