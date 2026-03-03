import React, { forwardRef } from 'react';
import { View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

type LocationMapPreviewProps = {
  latitude: number;
  longitude: number;
  style?: { flex?: number };
};

export const LocationMapPreview = forwardRef<MapView, LocationMapPreviewProps>(
  ({ latitude, longitude, style }, ref) => (
    <MapView
      ref={ref}
      style={[{ flex: 1 }, style]}
      initialRegion={{
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker coordinate={{ latitude, longitude }} title="Farm location" />
    </MapView>
  ),
);
