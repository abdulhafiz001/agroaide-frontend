import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';

import { LeafletMap, type LeafletMapHandle } from '@/components/LeafletMap';

type MapCoordinate = { latitude: number; longitude: number };

export type FarmMapFieldPolygon = {
  fieldId: string;
  name: string;
  crop?: string;
  polygon: MapCoordinate[];
};

type FarmMapViewProps = {
  center: MapCoordinate;
  /** Farm outline sized from registered farmSizeM2 */
  polygon?: MapCoordinate[];
  /** Measured crop-field polygons inside the farm */
  fields?: FarmMapFieldPolygon[];
  farmName?: string;
};

export type FarmMapViewHandle = {
  zoomToFarm: () => void;
};

const FIELD_COLORS = ['#57b346', '#3b82f6', '#db9534', '#8b5cf6', '#14b8a6', '#e63946'];

export const FarmMapView = forwardRef<FarmMapViewHandle, FarmMapViewProps>(function FarmMapView(
  { center, polygon = [], fields = [], farmName },
  ref,
) {
  const mapRef = useRef<LeafletMapHandle>(null);

  const polygons = useMemo(() => {
    const layers: Array<{
      coordinates: MapCoordinate[];
      color: string;
      fillOpacity: number;
      label?: string;
    }> = [];

    if (polygon.length >= 3) {
      layers.push({
        coordinates: polygon,
        color: '#1b4332',
        fillOpacity: 0.08,
        label: farmName || 'Farm',
      });
    }

    fields
      .filter((f) => f.polygon.length >= 3)
      .forEach((f, index) => {
        layers.push({
          coordinates: f.polygon,
          color: FIELD_COLORS[index % FIELD_COLORS.length],
          fillOpacity: 0.32,
          label: f.crop ? `${f.name} · ${f.crop}` : f.name,
        });
      });

    return layers;
  }, [polygon, fields, farmName]);

  useImperativeHandle(
    ref,
    () => ({
      zoomToFarm: () => {
        // Fit all farm + field polygons so both outlines are visible.
        mapRef.current?.fitToPolygons();
        // Fallback center zoom if no polygons yet.
        if (polygons.length === 0) {
          mapRef.current?.animateToRegion(
            {
              latitude: center.latitude,
              longitude: center.longitude,
              latitudeDelta: 0.008,
              longitudeDelta: 0.008,
            },
            600,
          );
        }
      },
    }),
    [center.latitude, center.longitude, polygons.length],
  );

  return (
    <LeafletMap
      ref={mapRef}
      center={center}
      zoom={16}
      scrollEnabled={false}
      markers={[
        {
          latitude: center.latitude,
          longitude: center.longitude,
          title: farmName || 'Farm',
          color: '#1b4332',
        },
      ]}
      polygons={polygons}
    />
  );
});
