import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from '@/design-system/styled';

import { LeafletMap } from '@/components/LeafletMap';
import { useToast } from '@/components/Toast';
import { Button, Surface, Text } from '@/design-system/components';
import { farmApi } from '@/services/farmApi';
import { isOfflineQueuedError, withOfflineQueue } from '@/services/offlineQueue';
import { useAppStore } from '@/store/useAppStore';
import { formatAreaM2 } from '@/utils/formatters';
import {
  filterGpsStream,
  type GpsPoint,
  haversineMeters,
  pointsToGeoJsonPolygon,
  sphericalPolygonAreaM2,
} from '@/utils/geoArea';

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const MapWrap = styled.View`
  flex: 1;
  min-height: 280px;
`;

const Panel = styled(Surface)`
  margin: ${({ theme }) => theme.spacing.md}px;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const StatsRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  gap: 12px;
`;

export default function WalkBoundaryScreen() {
  const theme = useTheme();
  const toast = useToast();
  const router = useRouter();
  const token = useAppStore((s) => s.accessToken) ?? '';
  const { fieldId, fieldName } = useLocalSearchParams<{ fieldId: string; fieldName?: string }>();

  const [walking, setWalking] = useState(false);
  const [rawPoints, setRawPoints] = useState<GpsPoint[]>([]);
  const [saving, setSaving] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const filtered = useMemo(() => filterGpsStream(rawPoints), [rawPoints]);
  const liveArea = useMemo(() => sphericalPolygonAreaM2(filtered), [filtered]);
  const center = filtered[filtered.length - 1] ?? filtered[0] ?? { latitude: 9.08, longitude: 8.68 };

  const stopWatch = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
    setWalking(false);
  }, []);

  useEffect(() => () => stopWatch(), [stopWatch]);

  const startWalk = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setPermissionDenied(true);
      toast.error('Permission needed', 'Location permission is required to map your field.');
      return;
    }
    setPermissionDenied(false);
    setRawPoints([]);
    setWalking(true);

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 1000,
        distanceInterval: 1,
      },
      (loc) => {
        const next: GpsPoint = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          accuracy: loc.coords.accuracy,
          timestamp: loc.timestamp,
        };
        setRawPoints((prev) => [...prev, next]);
      },
    );
  };

  const finishAndSave = async () => {
    stopWatch();
    if (filtered.length < 3) {
      toast.error('Keep walking', 'Walk at least 3 good GPS points around the boundary.');
      return;
    }

    const closed = [...filtered];
    const start = closed[0];
    const end = closed[closed.length - 1];
    if (haversineMeters(start, end) > 15) {
      closed.push(start);
    }

    const areaM2 = Math.round(sphericalPolygonAreaM2(closed) * 100) / 100;
    const geojson = pointsToGeoJsonPolygon(closed);
    setSaving(true);
    try {
      await withOfflineQueue({
        actionType: 'boundary.update',
        runOnline: (clientUuid, clientTimestamp) =>
          farmApi.updateBoundary(token, String(fieldId), {
            geojson,
            areaM2,
            clientUuid,
            clientTimestamp,
          }),
        buildPayload: () => ({ fieldId: Number(fieldId), geojson, areaM2 }),
      });
      toast.success('Boundary saved', formatAreaM2(areaM2));
      router.back();
    } catch (error) {
      if (isOfflineQueuedError(error)) {
        toast.info('Saved offline', 'Boundary will sync when you reconnect.');
        router.back();
      } else {
        toast.error('Could not save', error instanceof Error ? error.message : 'Check your connection and try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: 16, paddingTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} onPress={() => router.back()} />
        <View style={{ flex: 1 }}>
          <Text variant="headline">Walk the perimeter</Text>
          <Text variant="caption" tone="muted">
            {fieldName || `Field #${fieldId}`}
          </Text>
        </View>
      </View>

      <MapWrap>
        <LeafletMap
          center={center}
          zoom={17}
          scrollEnabled
          markers={
            filtered.length
              ? [{ latitude: center.latitude, longitude: center.longitude, title: 'You', color: '#f97316' }]
              : []
          }
          polygons={
            filtered.length >= 3
              ? [{ coordinates: filtered, color: '#57b346', fillOpacity: 0.25 }]
              : filtered.length >= 2
                ? [{ coordinates: filtered, color: '#57b346', fillOpacity: 0.05 }]
                : []
          }
        />
      </MapWrap>

      <Panel rounded="xl">
        <StatsRow>
          <View>
            <Text variant="caption" tone="muted">
              Points (filtered)
            </Text>
            <Text variant="headline">{filtered.length}</Text>
          </View>
          <View>
            <Text variant="caption" tone="muted">
              Live area
            </Text>
            <Text variant="headline">{formatAreaM2(liveArea)}</Text>
          </View>
          <View>
            <Text variant="caption" tone="muted">
              Accuracy ≤
            </Text>
            <Text variant="headline">5 m</Text>
          </View>
        </StatsRow>
        {permissionDenied ? (
          <Text variant="body" tone="danger">
            Enable location permission in system settings to continue.
          </Text>
        ) : (
          <Text variant="caption" tone="muted">
            Walk slowly along the edge of your plot. Points worse than 5 m accuracy are ignored.
          </Text>
        )}
        {!walking ? (
          <Button label="Start walking" onPress={startWalk} fullWidth />
        ) : (
          <Button
            label={saving ? 'Saving…' : 'Finish & save boundary'}
            onPress={finishAndSave}
            loading={saving}
            fullWidth
          />
        )}
        {walking ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator color={theme.colors.primary} />
            <Text variant="caption">Recording GPS…</Text>
            <Button label="Cancel" variant="ghost" onPress={stopWatch} />
          </View>
        ) : null}
      </Panel>
    </Screen>
  );
}
