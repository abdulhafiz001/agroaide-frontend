import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { useTheme } from 'styled-components/native';

type LocationMapPreviewProps = {
  latitude: number;
  longitude: number;
  style?: { flex?: number };
};

export const LocationMapPreview = forwardRef<unknown, LocationMapPreviewProps>(
  ({ latitude, longitude, style }, _ref) => {
    const theme = useTheme();
    return (
      <View
        style={[
          { flex: 1, borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.surfaceAlt },
          style,
        ]}
      >
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: theme.colors.primary + '33',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          />
        </View>
      </View>
    );
  },
);
