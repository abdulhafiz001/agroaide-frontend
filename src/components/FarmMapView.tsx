import React from 'react';

import { LeafletMap } from '@/components/LeafletMap';

type MapCoordinate = { latitude: number; longitude: number };

type FarmMapViewProps = {
  center: MapCoordinate;
  polygon: MapCoordinate[];
};

export function FarmMapView({ center, polygon }: FarmMapViewProps) {
  return (
    <LeafletMap
      center={center}
      zoom={16}
      scrollEnabled={false}
      markers={[
        {
          latitude: center.latitude,
          longitude: center.longitude,
          title: 'Farm',
          color: '#57b346',
        },
      ]}
      polygons={
        polygon.length > 0
          ? [
              {
                coordinates: polygon,
                color: '#57b346',
                fillOpacity: 0.2,
              },
            ]
          : []
      }
    />
  );
}
