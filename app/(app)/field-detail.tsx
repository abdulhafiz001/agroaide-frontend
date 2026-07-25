import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { FarmMapView, type FarmMapViewHandle } from '@/components/FarmMapView';
import { Button, Chip, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { farmApi } from '@/services/farmApi';
import { useAppStore } from '@/store/useAppStore';
import { formatAreaWithFt, formatNaira } from '@/utils/formatters';

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Container = styled(ScrollView).attrs(({ theme }) => ({
  contentContainerStyle: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
}))``;

export default function FieldDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const token = useAppStore((s) => s.accessToken) ?? '';
  const mapRef = useRef<FarmMapViewHandle>(null);
  const { fieldId, fieldName } = useLocalSearchParams<{ fieldId: string; fieldName?: string }>();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['fieldDetail', fieldId],
    queryFn: () => farmApi.getField(token, String(fieldId)),
    enabled: Boolean(token && fieldId),
  });

  const field = data?.field;
  const summary = data?.farmSummary;
  const mapData = data?.map;

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text variant="headline">{field?.name || fieldName || 'Field'}</Text>
          <Text variant="caption" tone="muted">
            {summary?.farmName ? `Inside ${summary.farmName}` : 'Field details'}
          </Text>
        </View>
      </View>

      <Container>
        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 32 }} />
        ) : isError || !field ? (
          <Surface rounded="xl" style={{ gap: 12, marginTop: 16, padding: 20 }}>
            <Text tone="muted">Could not load this field.</Text>
            <Button label="Retry" onPress={() => refetch()} />
          </Surface>
        ) : (
          <>
            <Surface rounded="xl" style={{ gap: 10, marginTop: 8 }}>
              <Text variant="eyebrow" tone="accent">
                Overview
              </Text>
              <Text variant="headline">{field.name}</Text>
              <Text variant="body" tone="muted">
                {field.crop} · {formatAreaWithFt(field.area)}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Chip label={`Health ${field.health}%`} tone={field.health >= 70 ? 'success' : 'warning'} />
                <Chip label={`Moisture ${field.moisture}%`} tone="info" />
                <Chip label={field.status} tone={field.status === 'active' ? 'success' : 'default'} />
                {field.hasMeasuredBoundary ? (
                  <Chip label="Boundary measured" tone="success" />
                ) : (
                  <Chip label="Boundary pending" tone="warning" />
                )}
                {field.daysSincePlanting != null ? (
                  <Chip label={`Day ${field.daysSincePlanting}`} tone="default" />
                ) : null}
              </View>
              {field.plantedAt ? (
                <Text variant="caption" tone="muted">
                  Planted {new Date(field.plantedAt).toLocaleDateString()}
                </Text>
              ) : null}
            </Surface>

            <Surface rounded="xl" style={{ gap: 10, marginTop: 12 }}>
              <Text variant="eyebrow" tone="accent">
                Finances
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                <View style={{ minWidth: '40%' }}>
                  <Text variant="caption" tone="muted">
                    Expenses
                  </Text>
                  <Text variant="headline">{formatNaira(field.totalExpense)}</Text>
                </View>
                <View style={{ minWidth: '40%' }}>
                  <Text variant="caption" tone="muted">
                    Income
                  </Text>
                  <Text variant="headline">{formatNaira(field.totalIncome)}</Text>
                </View>
                <View style={{ minWidth: '40%' }}>
                  <Text variant="caption" tone="muted">
                    Net
                  </Text>
                  <Text variant="headline">{formatNaira(field.netProfit)}</Text>
                </View>
              </View>
              <Button
                label="Open ledger"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/field-finances',
                    params: { fieldId: field.id, fieldName: field.name },
                  })
                }
              />
            </Surface>

            {mapData ? (
              <View style={{ marginTop: 16, gap: 8 }}>
                <Text variant="headline">Location</Text>
                <Text variant="caption" tone="muted">
                  Farm outline from your registered size, with this field boundary inside it.
                </Text>
                <View style={{ height: 220, borderRadius: 16, overflow: 'hidden' }}>
                  <FarmMapView
                    ref={mapRef}
                    center={mapData.center}
                    polygon={mapData.polygon}
                    farmName={mapData.farmName || summary?.farmName}
                    fields={mapData.fields ?? []}
                  />
                </View>
                <Chip label="Zoom to farm" tone="info" onPress={() => mapRef.current?.zoomToFarm()} />
              </View>
            ) : null}

            <View style={{ marginTop: 20, gap: 10 }}>
              <Text variant="headline">Actions</Text>
              <Button
                label="Walk / update boundary"
                onPress={() =>
                  router.push({
                    pathname: '/walk-boundary',
                    params: { fieldId: field.id, fieldName: field.name },
                  })
                }
                fullWidth
              />
              <Button
                label="Scan crop health"
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/farm-scan',
                    params: { fieldId: field.id, fieldName: field.name, fieldCrop: field.crop },
                  })
                }
                fullWidth
              />
              <Button
                label="Field finances"
                variant="ghost"
                onPress={() =>
                  router.push({
                    pathname: '/field-finances',
                    params: { fieldId: field.id, fieldName: field.name },
                  })
                }
                fullWidth
              />
            </View>
          </>
        )}
      </Container>
    </Screen>
  );
}
