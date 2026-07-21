import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { Chip, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { weatherApi } from '@/services/weatherApi';
import { useAppStore } from '@/store/useAppStore';

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.sm}px ${theme.spacing.md}px`};
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const Body = styled.ScrollView.attrs(({ theme }) => ({
  contentContainerStyle: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl + 40,
    gap: 14,
  },
}))``;

const conditionIcon = (icon?: string): keyof typeof Ionicons.glyphMap => {
  switch (icon) {
    case 'sunny':
      return 'sunny-outline';
    case 'partly-cloudy':
      return 'partly-sunny-outline';
    case 'cloudy':
      return 'cloudy-outline';
    case 'rain':
    case 'rainy':
      return 'rainy-outline';
    case 'storm':
      return 'thunderstorm-outline';
    case 'snow':
      return 'snow-outline';
    default:
      return 'cloud-outline';
  }
};

export default function WeatherDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const accessToken = useAppStore((state) => state.accessToken);
  const params = useLocalSearchParams<{
    title?: string;
    message?: string;
    severity?: string;
  }>();

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['weatherDetail'],
    queryFn: () => weatherApi.getForecast(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });

  const current = data?.current;
  const forecast = data?.weatherForecast ?? [];
  const hourly = (data?.hourly ?? []).slice(0, 8);
  const soilHealth = data?.soilHealth ?? [];
  const alerts = data?.alerts ?? [];

  const pushAlert = useMemo(() => {
    if (!params.title && !params.message) return null;
    return {
      title: params.title ? String(params.title) : 'Weather alert',
      advice: params.message ? String(params.message) : '',
      severity: params.severity ? String(params.severity) : 'Moderate',
    };
  }, [params.message, params.severity, params.title]);

  const visibleAlerts = useMemo(() => {
    if (!pushAlert) return alerts;
    const already = alerts.some(
      (a) => a.title === pushAlert.title || a.advice === pushAlert.advice,
    );
    return already
      ? alerts
      : [
          {
            severity: pushAlert.severity,
            title: pushAlert.title,
            advice: pushAlert.advice,
            gradient: ['#e67e22', '#c0392b'] as [string, string],
          },
          ...alerts,
        ];
  }, [alerts, pushAlert]);

  return (
    <Screen>
      <Header>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Ionicons name="partly-sunny" size={22} color={theme.colors.primary} />
        <Text variant="title" style={{ flex: 1 }}>
          Weather intelligence
        </Text>
        <TouchableOpacity onPress={() => refetch()} hitSlop={12}>
          <Ionicons name="refresh" size={20} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </Header>

      <Body>
        {isLoading ? (
          <View style={{ paddingVertical: 48, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text tone="muted" style={{ marginTop: 12 }}>
              Loading live farm weather…
            </Text>
          </View>
        ) : null}

        {isError ? (
          <Surface rounded="xl" style={{ gap: 10, alignItems: 'center', paddingVertical: 28 }}>
            <Ionicons name="cloud-offline-outline" size={32} color={theme.colors.danger} />
            <Text variant="headline">Could not load weather</Text>
            <Text tone="muted" style={{ textAlign: 'center' }}>
              Check your connection, or make sure your farm GPS is set in Settings.
            </Text>
            <Chip label={isFetching ? 'Retrying…' : 'Retry'} tone="info" onPress={() => refetch()} />
          </Surface>
        ) : null}

        {!isLoading && !isError && !current && forecast.length === 0 ? (
          <Surface rounded="xl" style={{ gap: 10, alignItems: 'center', paddingVertical: 28 }}>
            <Ionicons name="location-outline" size={32} color={theme.colors.accent} />
            <Text variant="headline">Farm location needed</Text>
            <Text tone="muted" style={{ textAlign: 'center' }}>
              Set your farm GPS in Settings so weather alerts and forecasts match your land.
            </Text>
            <Chip label="Open settings" tone="success" onPress={() => router.push('/(app)/settings')} />
          </Surface>
        ) : null}

        {pushAlert || visibleAlerts.length > 0 ? (
          <Surface
            rounded="xl"
            style={{
              gap: 10,
              borderWidth: 1,
              borderColor: `${theme.colors.danger}40`,
              backgroundColor: `${theme.colors.danger}10`,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="warning" size={18} color={theme.colors.danger} />
              <Text variant="headline">Active weather alerts</Text>
            </View>
            {visibleAlerts.map((alert, index) => (
              <View key={`${alert.title}-${index}`} style={{ gap: 4, paddingTop: index ? 8 : 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Chip
                    label={alert.severity || 'Alert'}
                    tone={
                      String(alert.severity).toLowerCase().includes('high') ||
                      String(alert.severity).toLowerCase().includes('severe')
                        ? 'danger'
                        : 'warning'
                    }
                  />
                  <Text variant="headline" style={{ flex: 1 }}>
                    {alert.title}
                  </Text>
                </View>
                <Text variant="body">{alert.advice}</Text>
              </View>
            ))}
          </Surface>
        ) : null}

        {current ? (
          <Surface rounded="xl" variant="elevated" style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: `${theme.colors.primary}18`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={conditionIcon(current.icon)}
                  size={28}
                  color={theme.colors.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="display">{Math.round(current.temperature)}°</Text>
                <Text variant="body">{current.condition}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text variant="caption" tone="muted">
                  Feels {Math.round(current.apparentTemperature)}°
                </Text>
                <Text variant="caption" tone="muted">
                  Humidity {Math.round(current.humidity)}%
                </Text>
                <Text variant="caption" tone="muted">
                  Wind {Math.round(current.windSpeed)} km/h
                </Text>
              </View>
            </View>
            {current.precipitation > 0 ? (
              <Text variant="caption" tone="muted">
                Precipitation now: {current.precipitation} mm
              </Text>
            ) : null}
          </Surface>
        ) : null}

        {hourly.length > 0 ? (
          <Surface rounded="xl" style={{ gap: 10 }}>
            <Text variant="headline">Next hours</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {hourly.map((hour) => (
                <View
                  key={hour.time}
                  style={{
                    minWidth: 72,
                    padding: 10,
                    borderRadius: 14,
                    backgroundColor: theme.colors.surfaceAlt,
                    gap: 4,
                  }}
                >
                  <Text variant="caption" tone="muted">
                    {new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text variant="headline">{Math.round(hour.temperature)}°</Text>
                  <Text variant="caption" tone="muted">
                    {hour.precipitationProbability}% rain
                  </Text>
                </View>
              ))}
            </View>
          </Surface>
        ) : null}

        {forecast.length > 0 ? (
          <Surface rounded="xl" style={{ gap: 4 }}>
            <Text variant="headline" style={{ marginBottom: 6 }}>
              7-day outlook
            </Text>
            {forecast.slice(0, 7).map((day) => (
              <View
                key={`${day.date}-${day.day}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 10,
                  borderTopWidth: 1,
                  borderTopColor: theme.colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <Ionicons
                    name={conditionIcon(day.icon)}
                    size={18}
                    color={theme.colors.textSecondary}
                  />
                  <View>
                    <Text variant="body">{day.day}</Text>
                    <Text variant="caption" tone="muted">
                      {day.condition}
                    </Text>
                  </View>
                </View>
                <Text variant="caption" tone="muted" style={{ width: 64, textAlign: 'center' }}>
                  {Math.round(day.precipitationProbability)}%
                </Text>
                <Text variant="body" style={{ width: 80, textAlign: 'right' }}>
                  {Math.round(day.high)}° / {Math.round(day.low)}°
                </Text>
              </View>
            ))}
          </Surface>
        ) : null}

        {soilHealth.length > 0 ? (
          <Surface rounded="xl" style={{ gap: 10 }}>
            <Text variant="headline">Soil & field conditions</Text>
            {soilHealth.map((item) => (
              <View
                key={item.label}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <Text variant="body">{item.label}</Text>
                <Text variant="headline">
                  {item.value}
                  {item.unit ? ` ${item.unit}` : ''}
                </Text>
              </View>
            ))}
          </Surface>
        ) : null}
      </Body>
    </Screen>
  );
}
