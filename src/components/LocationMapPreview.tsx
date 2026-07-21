import React, { forwardRef } from 'react';
import { Platform, View } from 'react-native';
import Constants from 'expo-constants';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { Text } from '@/design-system/components';

type LocationMapPreviewProps = {
  latitude: number;
  longitude: number;
  style?: { flex?: number };
};

function hasGoogleMapsApiKey(): boolean {
  const fromExtra = Constants.expoConfig?.extra?.googleMapsApiKey;
  const fromAndroid = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;
  const key = (fromExtra || fromAndroid || '').toString().trim();
  return Boolean(key) && !key.includes('process.env');
}

export const LocationMapPreview = forwardRef<MapView, LocationMapPreviewProps>(
  ({ latitude, longitude, style }, ref) => {
    if (Platform.OS === 'android' && !hasGoogleMapsApiKey()) {
      return (
        <View
          style={[
            {
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#e8f5e9',
              padding: 16,
              gap: 6,
            },
            style,
          ]}
        >
          <Text variant="caption" tone="muted" align="center">
            Map preview needs a Google Maps API key.
          </Text>
          <Text variant="body" align="center">
            {latitude.toFixed(5)}, {longitude.toFixed(5)}
          </Text>
        </View>
      );
    }

    return (
      <MapView
        ref={ref}
        style={[{ flex: 1 }, style]}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
      >
        <Marker coordinate={{ latitude, longitude }} title="Farm location" />
      </MapView>
    );
  },
);
