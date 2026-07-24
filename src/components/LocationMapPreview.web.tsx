import React, { forwardRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

import { LeafletMap, type LeafletMapHandle } from '@/components/LeafletMap';

type LocationMapPreviewProps = {
  latitude: number;
  longitude: number;
  style?: StyleProp<ViewStyle>;
};

export const LocationMapPreview = forwardRef<LeafletMapHandle, LocationMapPreviewProps>(
  ({ latitude, longitude, style }, ref) => (
    <LeafletMap
      ref={ref}
      style={style}
      center={{ latitude, longitude }}
      zoom={15}
      scrollEnabled
      markers={[
        {
          latitude,
          longitude,
          title: 'Farm location',
          color: '#57b346',
        },
      ]}
    />
  ),
);
