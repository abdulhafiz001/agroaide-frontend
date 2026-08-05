import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { FarmMapView, type FarmMapViewHandle } from '@/components/FarmMapView';
import { useToast } from '@/components/Toast';
import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { useTranslation } from '@/i18n/useTranslation';
import { ApiError } from '@/services/apiClient';
import { farmApi } from '@/services/farmApi';
import { marketApi } from '@/services/marketApi';
import { useAppStore } from '@/store/useAppStore';
import { formatAreaWithFt, formatNaira } from '@/utils/formatters';
import { computeInputEstimate, type InputEstimateResult } from '@/utils/inputEstimate';

const STEP_CM = 75;

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const HeaderBar = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background-color: ${({ theme }) => theme.colors.primary};
`;

const Container = styled(ScrollView).attrs(({ theme }) => ({
  contentContainerStyle: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
  },
}))``;

const calcSteps = ['Reading field area…', 'Counting plant stands…', 'Estimating seed…', 'Estimating fertilizer…', 'Writing your guide…'];

export default function FieldDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const toast = useToast();
  const { t } = useTranslation();
  const token = useAppStore((s) => s.accessToken) ?? '';
  const queryClient = useQueryClient();
  const mapRef = useRef<FarmMapViewHandle>(null);
  const { fieldId, fieldName } = useLocalSearchParams<{ fieldId: string; fieldName?: string }>();

  const [boundaryMenu, setBoundaryMenu] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [spacingMode, setSpacingMode] = useState<'steps' | 'cm'>('steps');
  const [rowInput, setRowInput] = useState('1');
  const [intraInput, setIntraInput] = useState('0.33');
  const [calcStep, setCalcStep] = useState(0);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['fieldDetail', fieldId],
    queryFn: () => farmApi.getField(token, String(fieldId)),
    enabled: Boolean(token && fieldId),
  });

  const field = data?.field;
  const summary = data?.farmSummary;
  const mapData = data?.map;

  const { data: cropMarket } = useQuery({
    queryKey: ['marketIntel', field?.crop],
    queryFn: () => marketApi.getMarketIntel(token, field?.crop),
    enabled: Boolean(token && field?.crop),
  });
  const cropPrice = cropMarket?.marketPrices?.[0];

  const clearBoundaryMutation = useMutation({
    mutationFn: () => farmApi.clearBoundary(token, String(fieldId)),
    onSuccess: () => {
      setBoundaryMenu(false);
      queryClient.invalidateQueries({ queryKey: ['fieldDetail', fieldId] });
      queryClient.invalidateQueries({ queryKey: ['farmOverview'] });
      toast.success('Boundary removed', 'Walk a new boundary whenever you are ready.');
    },
    onError: () => toast.error('Error', 'Could not remove boundary.'),
  });

  const estimateMutation = useMutation({
    mutationFn: async (): Promise<{ estimate: InputEstimateResult }> => {
      const rowVal = parseFloat(rowInput) || 0;
      const intraVal = parseFloat(intraInput) || 0;
      let rowCm = spacingMode === 'steps' ? rowVal * STEP_CM : rowVal;
      let intraCm = spacingMode === 'steps' ? intraVal * STEP_CM : intraVal;
      rowCm = Math.max(1, Math.min(1000, rowCm || 75));
      intraCm = Math.max(1, Math.min(1000, intraCm || 25));

      const localEstimate = computeInputEstimate({
        crop: field?.crop ?? 'Maize',
        areaM2: Number(field?.area ?? 0),
        hasMeasuredBoundary: Boolean(field?.hasMeasuredBoundary),
        rowCm,
        intraCm,
      });

      try {
        const remote = await farmApi.inputEstimate(token, String(fieldId), {
          rowCm,
          intraCm,
          spacingMode: 'cm',
        });
        if (remote?.estimate) {
          return { estimate: remote.estimate as InputEstimateResult };
        }
      } catch (err) {
        // Route missing / server error → still show local numbers so Calculate never looks broken.
        if (!(err instanceof ApiError) || (err.statusCode !== 404 && err.statusCode !== 0 && err.statusCode < 500)) {
          // Keep going to local fallback for common deploy/network issues.
        }
      }

      return { estimate: localEstimate };
    },
    onError: (err: any) => {
      toast.error('Calculate failed', err?.message || 'Could not calculate. Check your connection and try again.');
    },
  });

  useEffect(() => {
    if (!estimateMutation.isPending) {
      setCalcStep(0);
      return;
    }
    setCalcStep(0);
    const id = setInterval(() => {
      setCalcStep((s) => (s + 1) % calcSteps.length);
    }, 900);
    return () => clearInterval(id);
  }, [estimateMutation.isPending]);

  const estimate = estimateMutation.data?.estimate;

  const openCalc = () => {
    setShowCalc(true);
    setSpacingMode('steps');
    setRowInput('1');
    setIntraInput('0.33');
    estimateMutation.reset();
  };

  const dayRemindersNote = useMemo(() => null, []);

  return (
    <Screen edges={['top', 'bottom']}>
      <HeaderBar>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color="#fff" style={{ fontWeight: '700' }} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text variant="headline" style={{ color: '#fff', fontWeight: '700' }}>
            {field?.name || fieldName || t('fieldFallback')}
          </Text>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {summary?.farmName ? `${t('insideFarm')} ${summary.farmName}` : t('fieldDetails')}
          </Text>
        </View>
      </HeaderBar>

      <Container>
        {isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 32 }} />
        ) : isError || !field ? (
          <Surface rounded="xl" style={{ gap: 12, marginTop: 16, padding: 20 }}>
            <Text tone="muted">{t('couldNotLoadField')}</Text>
            <Button label={t('retry')} onPress={() => refetch()} />
          </Surface>
        ) : (
          <>
            <Surface rounded="xl" style={{ gap: 10, marginTop: 12 }}>
              <Text variant="eyebrow" tone="accent">
                {t('overview')}
              </Text>
              <Text variant="headline">{field.name}</Text>
              <Text variant="body" tone="muted">
                {field.crop} · {formatAreaWithFt(field.area)}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Chip label={`${t('healthLabel')} ${field.health}%`} tone={field.health >= 70 ? 'success' : 'warning'} />
                <Chip label={`${t('moistureLabel')} ${field.moisture}%`} tone="info" />
                <Chip label={field.status} tone={field.status === 'active' ? 'success' : 'default'} />
                {field.hasMeasuredBoundary ? (
                  <Chip label={t('boundaryMeasured')} tone="success" onPress={() => setBoundaryMenu(true)} />
                ) : (
                  <Chip label={t('boundaryPending')} tone="warning" />
                )}
              </View>
              {cropPrice ? (
                <Surface variant="muted" style={{ marginTop: 8, padding: 12, borderRadius: 12, gap: 4 }}>
                  <Text variant="caption" tone="accent">
                    Nearest market price
                  </Text>
                  <Text variant="headline">
                    {cropPrice.available !== false && cropPrice.price != null
                      ? `₦${Number(cropPrice.price).toLocaleString('en-NG')}${cropPrice.unit ? ` / ${cropPrice.unit}` : ''}`
                      : 'No price yet'}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {cropMarket?.market?.name
                      ? `${cropMarket.market.name}${cropMarket.market.city ? `, ${cropMarket.market.city}` : ''}`
                      : cropPrice.location}
                    {cropPrice.trend === 'up'
                      ? ' · Rising'
                      : cropPrice.trend === 'down'
                        ? ' · Falling'
                        : cropPrice.available
                          ? ' · Stable'
                          : ''}
                  </Text>
                </Surface>
              ) : null}
            </Surface>

            <Surface rounded="xl" style={{ gap: 10, marginTop: 12 }}>
              <Text variant="eyebrow" tone="accent">
                {t('finances')}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
                <View style={{ minWidth: '40%' }}>
                  <Text variant="caption" tone="muted">
                    {t('expenses')}
                  </Text>
                  <Text variant="headline">{formatNaira(field.totalExpense)}</Text>
                </View>
                <View style={{ minWidth: '40%' }}>
                  <Text variant="caption" tone="muted">
                    {t('income')}
                  </Text>
                  <Text variant="headline">{formatNaira(field.totalIncome)}</Text>
                </View>
                <View style={{ minWidth: '40%' }}>
                  <Text variant="caption" tone="muted">
                    {t('net')}
                  </Text>
                  <Text variant="headline">{formatNaira(field.netProfit)}</Text>
                </View>
              </View>
              <Button
                label={t('openLedger')}
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
                <Text variant="headline">{t('location')}</Text>
                <View style={{ height: 220, borderRadius: 16, overflow: 'hidden' }}>
                  <FarmMapView
                    ref={mapRef}
                    center={mapData.center}
                    polygon={mapData.polygon}
                    farmName={mapData.farmName || summary?.farmName}
                    fields={mapData.fields ?? []}
                  />
                </View>
                <Chip label={t('zoomToFarm')} tone="info" onPress={() => mapRef.current?.zoomToFarm()} />
              </View>
            ) : null}

            <View style={{ marginTop: 20, gap: 10 }}>
              <Text variant="headline">{t('actions')}</Text>
              <Button label="Seed & fertilizer guide" onPress={openCalc} fullWidth />
              {!field.hasMeasuredBoundary ? (
                <Button
                  label={t('walkUpdateBoundary')}
                  variant="secondary"
                  onPress={() =>
                    router.push({
                      pathname: '/walk-boundary',
                      params: { fieldId: field.id, fieldName: field.name },
                    })
                  }
                  fullWidth
                />
              ) : null}
              <Button
                label={t('scanCropHealth')}
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
                label={t('fieldFinances')}
                variant="secondary"
                onPress={() =>
                  router.push({
                    pathname: '/field-finances',
                    params: { fieldId: field.id, fieldName: field.name },
                  })
                }
                fullWidth
              />
            </View>
            {dayRemindersNote}
          </>
        )}
      </Container>

      <Modal visible={boundaryMenu} transparent animationType="fade" onRequestClose={() => setBoundaryMenu(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Surface rounded="xl" style={{ margin: 16, gap: 10, padding: 18 }}>
            <Text variant="headline">Field boundary</Text>
            <Text variant="caption" tone="muted">
              Update by walking again, or delete so you can create a new one.
            </Text>
            <Button
              label="Update boundary"
              onPress={() => {
                setBoundaryMenu(false);
                router.push({
                  pathname: '/walk-boundary',
                  params: { fieldId: String(fieldId), fieldName: field?.name },
                });
              }}
              fullWidth
            />
            <Button
              label="Delete boundary"
              variant="secondary"
              loading={clearBoundaryMutation.isPending}
              onPress={() =>
                Alert.alert('Delete boundary?', 'The walked outline will be removed.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => clearBoundaryMutation.mutate() },
                ])
              }
              fullWidth
            />
            <Button label="Cancel" variant="ghost" onPress={() => setBoundaryMenu(false)} fullWidth />
          </Surface>
        </View>
      </Modal>

      <Modal visible={showCalc} animationType="slide" onRequestClose={() => setShowCalc(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
          <HeaderBar>
            <TouchableOpacity onPress={() => setShowCalc(false)} hitSlop={12}>
              <Ionicons name="close" size={26} color="#fff" />
            </TouchableOpacity>
            <Text variant="headline" style={{ color: '#fff', fontWeight: '700', flex: 1 }}>
              Seed & fertilizer
            </Text>
          </HeaderBar>
          <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 40 }}>
            <Text variant="caption" tone="muted">
              Uses your field area. Spacing can be steps (1 step ≈ 75 cm) or centimetres.
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="Steps" tone={spacingMode === 'steps' ? 'success' : 'default'} onPress={() => setSpacingMode('steps')} />
              <Chip
                label="cm"
                tone={spacingMode === 'cm' ? 'success' : 'default'}
                onPress={() => {
                  setSpacingMode('cm');
                  setRowInput(String(Math.round((parseFloat(rowInput) || 1) * STEP_CM)));
                  setIntraInput(String(Math.round((parseFloat(intraInput) || 0.33) * STEP_CM)));
                }}
              />
            </View>
            <InputField
              label={spacingMode === 'steps' ? 'Row spacing (steps)' : 'Row spacing (cm)'}
              value={rowInput}
              onChangeText={setRowInput}
              keyboardType="decimal-pad"
            />
            <InputField
              label={spacingMode === 'steps' ? 'Plant spacing (steps)' : 'Plant spacing (cm)'}
              value={intraInput}
              onChangeText={setIntraInput}
              keyboardType="decimal-pad"
            />
            <Button
              label="Calculate"
              onPress={() => estimateMutation.mutate()}
              loading={estimateMutation.isPending}
              fullWidth
            />

            {estimateMutation.isPending ? (
              <Surface rounded="xl" style={{ gap: 12, padding: 20, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text variant="headline">{calcSteps[calcStep]}</Text>
                <Text variant="caption" tone="muted">
                  Working from your field size…
                </Text>
              </Surface>
            ) : null}

            {estimateMutation.isError && !estimateMutation.isPending ? (
              <Surface rounded="xl" style={{ gap: 8, padding: 16 }}>
                <Text variant="headline">Could not calculate</Text>
                <Text variant="caption" tone="muted">
                  {(estimateMutation.error as any)?.message || 'Something went wrong. Try again.'}
                </Text>
                <Button label="Try again" variant="secondary" onPress={() => estimateMutation.mutate()} />
              </Surface>
            ) : null}

            {estimate ? (
              <Surface rounded="xl" style={{ gap: 12, marginTop: 8 }}>
                {estimate.areaSource !== 'measured' ? (
                  <Chip label="Using estimate area — walk boundary for accuracy" tone="warning" />
                ) : (
                  <Chip label="Using measured boundary area" tone="success" />
                )}
                <Text variant="headline">Results</Text>
                <Text variant="body">Stands ≈ {estimate.population.toLocaleString()}</Text>
                {estimate.seedUnit === 'kg' && estimate.seedKg != null ? (
                  <Text variant="body">Seed ≈ {estimate.seedKg} kg</Text>
                ) : (
                  <Text variant="body">
                    Planting material ≈ {estimate.seedStands ?? estimate.population} {estimate.seedUnit}
                  </Text>
                )}
                {estimate.fertilizers.map((f) => (
                  <Text key={f.name} variant="body">
                    {f.name}: {f.kg} kg (~{f.bags50kg} × 50 kg bags)
                  </Text>
                ))}
                <Surface variant="muted" style={{ padding: 12, borderRadius: 12, gap: 8 }}>
                  <Text variant="caption" tone="accent">
                    Farmer guide
                  </Text>
                  <Text variant="body">{estimate.aiSummary}</Text>
                </Surface>
                <Text variant="caption" tone="muted">
                  {estimate.disclaimer}
                </Text>
              </Surface>
            ) : null}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </Screen>
  );
}
