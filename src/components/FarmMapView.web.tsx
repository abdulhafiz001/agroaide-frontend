import React from 'react';
import { View } from 'react-native';
import { useTheme } from 'styled-components/native';

type MapCoordinate = { latitude: number; longitude: number };

type FarmMapViewProps = {
  center: MapCoordinate;
  polygon: MapCoordinate[];
};

export function FarmMapView({ center, polygon }: FarmMapViewProps) {
  const theme = useTheme();
  return (
    <View
      style={{
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: theme.colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 180,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: theme.colors.primary + '22',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    </View>
  );
}
