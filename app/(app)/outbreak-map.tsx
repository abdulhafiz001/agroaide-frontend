import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { Chip, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { outbreakApi, type HeatmapPoint } from '@/services/outbreakApi';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';

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

const Container = styled(ScrollView).attrs(({ theme }) => ({
  contentContainerStyle: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl + 40,
  },
}))``;

const DISEASE_COLORS: Record<string, string> = {
  default: '#e63946',
  'Late Blight': '#8B0000',
  'Early Blight': '#FF6347',
  'Leaf Spot': '#FF8C00',
  'Rust': '#DAA520',
  'Mosaic Virus': '#9370DB',
  'Bacterial Wilt': '#2E8B57',
  'Powdery Mildew': '#778899',
};

function getDiseaseColor(disease: string): string {
  return DISEASE_COLORS[disease] ?? DISEASE_COLORS.default;
}

export default function OutbreakMapScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    title?: string;
    message?: string;
    disease?: string;
    crop?: string;
    level?: string;
  }>();
  const token = useAppStore((s) => s.accessToken) ?? '';
  const profile = useAppStore((s) => s.farmerProfile);
  const pushTitle = params.title ? String(params.title) : null;
  const pushMessage = params.message ? String(params.message) : null;

  const { data, isLoading } = useQuery({
    queryKey: ['outbreakHeatmap'],
    queryFn: () => outbreakApi.getHeatmap(token),
    enabled: Boolean(token),
  });

  const { data: alertsData } = useQuery({
    queryKey: ['outbreakAlerts'],
    queryFn: () => outbreakApi.getAlerts(token),
    enabled: Boolean(token),
  });

  const points = data?.points ?? [];
  const alerts = alertsData?.alerts ?? [];

  const farmLat = profile?.farmLatitude ?? 9.06;
  const farmLng = profile?.farmLongitude ?? 7.49;

  const diseases = [...new Set(points.map((p) => p.disease))];

  return (
    <Screen>
      <Header>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Ionicons name="warning" size={22} color={theme.colors.danger} />
        <Text variant="title" style={{ flex: 1 }}>
          {t('diseaseAlerts')}
        </Text>
      </Header>

      <Container>
        {pushTitle || pushMessage ? (
          <Surface
            rounded="xl"
            style={{
              gap: 8,
              marginBottom: 16,
              borderLeftWidth: 4,
              borderLeftColor: theme.colors.danger,
              backgroundColor: `${theme.colors.danger}10`,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="notifications" size={18} color={theme.colors.danger} />
              <Text variant="headline" style={{ flex: 1 }}>
                {pushTitle || 'Disease alert'}
              </Text>
              {params.level ? <Chip label={String(params.level)} tone="danger" /> : null}
            </View>
            {pushMessage ? <Text variant="body">{pushMessage}</Text> : null}
            {(params.disease || params.crop) && (
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                {params.disease ? <Chip label={String(params.disease)} tone="warning" /> : null}
                {params.crop ? <Chip label={String(params.crop)} tone="info" /> : null}
              </View>
            )}
          </Surface>
        ) : null}

        <View style={{ height: 300, borderRadius: 20, overflow: 'hidden', marginBottom: 16 }}>
          {isLoading ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.surfaceAlt }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : (
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: farmLat,
                longitude: farmLng,
                latitudeDelta: 0.5,
                longitudeDelta: 0.5,
              }}
            >
              {profile?.farmLatitude && profile?.farmLongitude && (
                <Marker
                  coordinate={{ latitude: profile.farmLatitude, longitude: profile.farmLongitude }}
                  title="Your Farm"
                  pinColor={theme.colors.primary}
                />
              )}
              {points.map((point, index) => (
                <React.Fragment key={`${point.latitude}-${point.longitude}-${index}`}>
                  <Circle
                    center={{ latitude: point.latitude, longitude: point.longitude }}
                    radius={2000}
                    fillColor={`${getDiseaseColor(point.disease)}30`}
                    strokeColor={getDiseaseColor(point.disease)}
                    strokeWidth={1}
                  />
                  <Marker
                    coordinate={{ latitude: point.latitude, longitude: point.longitude }}
                    title={point.disease}
                    description={`${point.count} report(s)`}
                    pinColor={getDiseaseColor(point.disease)}
                  />
                </React.Fragment>
              ))}
            </MapView>
          )}
        </View>

        {diseases.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {diseases.map((disease) => (
              <View key={disease} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: getDiseaseColor(disease) }} />
                <Text variant="caption" tone="muted">{disease}</Text>
              </View>
            ))}
          </View>
        )}

        {alerts.length > 0 && (
          <View style={{ gap: 12 }}>
            <Text variant="headline">{t('diseaseAlerts')}</Text>
            {alerts.map((alert) => (
              <Surface
                key={alert.id}
                rounded="xl"
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: theme.colors.danger,
                  gap: 6,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="warning" size={18} color={theme.colors.danger} />
                  <Text variant="headline" style={{ flex: 1 }}>{alert.title}</Text>
                </View>
                <Text variant="body" tone="muted">{alert.message}</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <Chip label={`${alert.data.reportCount} reports`} tone="danger" />
                </View>
              </Surface>
            ))}
          </View>
        )}

        {points.length === 0 && !isLoading && (
          <Surface rounded="xl" style={{ padding: 32, alignItems: 'center', gap: 12 }}>
            <Ionicons name="shield-checkmark" size={48} color={theme.colors.success} />
            <Text variant="headline">No outbreaks detected</Text>
            <Text variant="body" tone="muted" style={{ textAlign: 'center' }}>
              No disease outbreaks have been reported in your area recently. Keep scanning your crops to help protect the farming community!
            </Text>
          </Surface>
        )}
      </Container>
    </Screen>
  );
}
