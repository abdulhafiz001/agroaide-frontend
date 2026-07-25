import React, { useMemo } from 'react';

import { LeafletMap } from '@/components/LeafletMap';

type MapCoordinate = { latitude: number; longitude: number };

export type FarmMapFieldPolygon = {
  fieldId: string;
  name: string;
  crop?: string;
  polygon: MapCoordinate[];
};

type FarmMapViewProps = {
  center: MapCoordinate;
  /** Fallback farm outline when no measured fields exist */
  polygon?: MapCoordinate[];
  /** Measured crop-field polygons inside the farm */
  fields?: FarmMapFieldPolygon[];
  farmName?: string;
};

const FIELD_COLORS = ['#57b346', '#3b82f6', '#db9534', '#8b5cf6', '#14b8a6', '#e63946'];

export function FarmMapView({ center, polygon = [], fields = [], farmName }: FarmMapViewProps) {
  const measured = useMemo(
    () =>
      fields
        .filter((f) => f.polygon.length >= 3)
        .map((f, index) => ({
          coordinates: f.polygon,
          color: FIELD_COLORS[index % FIELD_COLORS.length],
          fillOpacity: 0.28,
          label: f.crop ? `${f.name} · ${f.crop}` : f.name,
        })),
    [fields],
  );

  const polygons =
    measured.length > 0
      ? measured
      : polygon.length > 0
        ? [
            {
              coordinates: polygon,
              color: '#57b346',
              fillOpacity: 0.15,
              label: farmName || 'Farm',
            },
          ]
        : [];

  return (
    <LeafletMap
      center={center}
      zoom={16}
      scrollEnabled={false}
      markers={[
        {
          latitude: center.latitude,
          longitude: center.longitude,
          title: farmName || 'Farm',
          color: '#57b346',
        },
      ]}
      polygons={polygons}
    />
  );
}
