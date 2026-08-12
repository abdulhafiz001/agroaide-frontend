import React from 'react';
import { View } from 'react-native';

import { Text } from '@/design-system/components';
import { formatCacheAge } from '@/services/offlineCache';

type Props = {
  visible: boolean;
  lastPulledAt?: string | null;
  label?: string;
};

export function OfflineBanner({ visible, lastPulledAt, label = 'information' }: Props) {
  if (!visible) return null;

  return (
    <View
      style={{
        backgroundColor: '#fff7ed',
        borderColor: '#fdba74',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
        gap: 4,
        marginBottom: 8,
      }}>
      <Text variant="headline" style={{ color: '#9a3412', fontSize: 15 }}>
        You are offline
      </Text>
      <Text variant="caption" style={{ color: '#9a3412' }}>
        Showing {label} from {formatCacheAge(lastPulledAt)}. Connect to the internet to get updates.
      </Text>
    </View>
  );
}
