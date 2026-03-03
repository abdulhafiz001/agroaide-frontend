import React from 'react';
import { View } from 'react-native';
import MapView, { Polygon } from 'react-native-maps';

type MapCoordinate = { latitude: number; longitude: number };

type FarmMapViewProps = {
  center: MapCoordinate;
  polygon: MapCoordinate[];
};

export function FarmMapView({ center, polygon }: FarmMapViewProps) {
  return (
    <MapView
      style={{ flex: 1 }}
      initialRegion={{
        latitude: center.latitude,
        longitude: center.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }}
      scrollEnabled={false}
    >
      {polygon.length > 0 && (
        <Polygon
          coordinates={polygon}
          fillColor="rgba(87, 179, 70, 0.2)"
          strokeColor="#57b346"
          strokeWidth={2}
        />
      )}
    </MapView>
  );
}
