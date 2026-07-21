import React from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import MapView, { Polygon, PROVIDER_GOOGLE } from 'react-native-maps';

import { Text } from '@/design-system/components';

type MapCoordinate = { latitude: number; longitude: number };

type FarmMapViewProps = {
  center: MapCoordinate;
  polygon: MapCoordinate[];
};

function hasGoogleMapsApiKey(): boolean {
  const fromExtra = Constants.expoConfig?.extra?.googleMapsApiKey;
  const fromAndroid = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
  const key = (fromExtra || fromAndroid || '').toString().trim();
  return Boolean(key) && !key.includes('process.env');
}

export function FarmMapView({ center, polygon }: FarmMapViewProps) {
  if (Platform.OS === 'android' && !hasGoogleMapsApiKey()) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9', padding: 16 }}>
        <Text variant="caption" tone="muted" align="center">
          Map needs a Google Maps API key. Coordinates saved: {center.latitude.toFixed(5)}, {center.longitude.toFixed(5)}
        </Text>
      </View>
    );
  }

  return (
    <MapView
      style={{ flex: 1 }}
      provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
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
