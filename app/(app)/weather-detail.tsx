import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { View } from 'react-native';
import styled from '@/design-system/styled';

import { Button, Surface, Text } from '@/design-system/components';
import { useAppStore } from '@/store/useAppStore';
import { weatherApi } from '@/services/weatherApi';

const Screen = styled.ScrollView.attrs({
  contentContainerStyle: {
    padding: 24,
    gap: 16,
    paddingBottom: 120,
  },
})`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

export default function WeatherDetailScreen() {
  const accessToken = useAppStore((state) => state.accessToken);
  const { data } = useQuery({
    queryKey: ['weatherDetail'],
    queryFn: () => weatherApi.getForecast(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });

  const forecast = data?.weatherForecast ?? [];
  const advisory = data?.advisories?.[0] ?? 'No advisory right now.';

  return (
    <Screen>
      <Text variant="display">Weather intelligence</Text>
      <Surface rounded="xl">
        <Text variant="headline">14 day outlook</Text>
        {forecast.concat(forecast).map((day, index) => (
          <View
            key={`${day.day}-${index}`}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 8,
            }}>
            <Text variant="body">{day.day}</Text>
            <Text variant="body" tone="muted">
              {day.condition}
            </Text>
            <Text variant="body">{day.high}° / {day.low}°</Text>
          </View>
        ))}
      </Surface>
      <Surface rounded="xl" style={{ gap: 8 }}>
        <Text variant="headline">Risk advisories</Text>
        <Text variant="body">{advisory}</Text>
        <Button label="Download offline brief" variant="secondary" />
      </Surface>
    </Screen>
  );
}

