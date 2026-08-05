import { LinearGradient } from 'expo-linear-gradient';
import {
    AlertTriangle,
    ArrowRight,
    Bell,
    Cloud,
    CloudDrizzle,
    CloudLightning,
    CloudRain,
    CloudSun,
    Droplets,
    Leaf,
    Snowflake,
    Sparkles,
    Plus,
    Sprout,
    Sun,
    Thermometer,
    Wind,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from 'styled-components/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useToast } from '@/components/Toast';
import { isOfflineQueuedError, withOfflineQueue } from '@/services/offlineQueue';
import { Button, Chip, InputField, ProgressDonut, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { dashboardApi } from '@/services/dashboardApi';
import { farmApi, type FarmField } from '@/services/farmApi';
import { marketApi, type MarketPrice } from '@/services/marketApi';
import { ApiError } from '@/services/apiClient';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
import { clearAuthQueryCache } from '@/utils/queryClient';
import { isFarmProfileComplete } from '@/utils/farmProfile';
import { formatAreaWithFt } from '@/utils/formatters';

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

const Header = styled(View)`
  padding-vertical: ${({ theme }) => theme.spacing.lg}px;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

const Section = styled(View)`
  margin-top: ${({ theme }) => theme.spacing.lg}px;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const Badge = styled(View)<{ tone: 'default' | 'info' | 'success' | 'warning' }>`
  padding: 4px 10px;
  border-radius: ${({ theme }) => theme.radii.pill}px;
  align-self: flex-start;
  background-color: ${({ theme, tone }) => {
    if (tone === 'info') return `${theme.colors.secondary}22`;
    if (tone === 'success') return `${theme.colors.success}22`;
    if (tone === 'warning') return `${theme.colors.warning}22`;
    return `${theme.colors.border}55`;
  }};
`;

type SoilTone = 'info' | 'success' | 'warning' | 'neutral' | 'danger';

const toneToColors: Record<SoilTone, { bg: string; icon: string }> = {
  info: { bg: '#e0f2ff', icon: '#1d4ed8' },
  success: { bg: '#d1fae5', icon: '#047857' },
  warning: { bg: '#fef3c7', icon: '#92400e' },
  neutral: { bg: '#f3f4f6', icon: '#374151' },
  danger: { bg: '#fde2e2', icon: '#b91c1c' },
};

const soilIconMap: Record<string, any> = {
  droplets: Droplets,
  leaf: Leaf,
  thermometer: Thermometer,
  sprout: Sprout,
  cloud: Cloud,
  wind: Wind,
};

const weatherIconMap: Record<string, any> = {
  sun: Sun,
  'cloud-sun': CloudSun,
  'cloud-rain': CloudRain,
  'cloud-drizzle': CloudDrizzle,
  'cloud-lightning': CloudLightning,
  'cloud-fog': Cloud,
  snowflake: Snowflake,
  cloud: Cloud,
  wind: Wind,
};

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: flex-end;
`;

const ModalContent = styled(Surface)`
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 24px;
  gap: 16px;
  max-height: 80%;
`;

export default function Dashboard() {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const accessToken = useAppStore((state) => state.accessToken);
  const farmerProfile = useAppStore((state) => state.farmerProfile);
  const signOut = useAppStore((state) => state.signOut);
  const userKey = farmerProfile?.id ?? accessToken ?? 'anon';

  const { t, getGreeting } = useTranslation();
  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldCrop, setNewFieldCrop] = useState('');
  const [newFieldArea, setNewFieldArea] = useState('');
  const [walkAfterSave, setWalkAfterSave] = useState(true);

  const profileCrops = farmerProfile?.crops?.filter(Boolean) ?? [];

  const {
    data: payload,
    isLoading: loading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboardSnapshot', userKey],
    queryFn: () => dashboardApi.getSnapshot(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });

  const profileCompleteLocally = isFarmProfileComplete(farmerProfile);
  const profileReady = profileCompleteLocally || Boolean(payload?.profileComplete);

  const { data: farmData } = useQuery({
    queryKey: ['farmOverview', userKey],
    queryFn: () => farmApi.getOverview(accessToken ?? ''),
    enabled: Boolean(accessToken) && profileReady,
  });

  const { data: marketData } = useQuery({
    queryKey: ['marketIntel', userKey],
    queryFn: () => marketApi.getMarketIntel(accessToken ?? ''),
    enabled: Boolean(accessToken) && profileReady,
  });

  const { data: aiInsightsData } = useQuery({
    queryKey: ['dashboardAiInsights', userKey],
    queryFn: () => dashboardApi.getAiInsights(accessToken ?? ''),
    enabled: Boolean(accessToken) && profileReady,
    staleTime: 1000 * 60 * 60,
  });

  const addFieldMutation = useMutation({
    mutationFn: () =>
      withOfflineQueue({
        actionType: 'field.create',
        runOnline: (clientUuid) =>
          farmApi.addField(accessToken ?? '', {
            name: newFieldName,
            crop: newFieldCrop,
            areaM2: parseFloat(newFieldArea) || 0,
            clientUuid,
          }),
        buildPayload: () => ({
          name: newFieldName,
          crop: newFieldCrop,
          areaM2: parseFloat(newFieldArea) || 0,
        }),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['farmOverview'] });
      setShowAddFarmModal(false);
      setNewFieldName('');
      setNewFieldCrop('');
      setNewFieldArea('');
      toast.success(t('fieldAdded'), walkAfterSave ? t('walkBoundaryWhenAtFarm') : 'You can walk the boundary later.');
      if (walkAfterSave && res.field?.id) {
        router.push({
          pathname: '/walk-boundary',
          params: { fieldId: res.field.id, fieldName: res.field.name },
        });
      }
    },
    onError: (err) => {
      if (isOfflineQueuedError(err)) {
        queryClient.invalidateQueries({ queryKey: ['farmOverview'] });
        setShowAddFarmModal(false);
        setNewFieldName('');
        setNewFieldCrop('');
        setNewFieldArea('');
        toast.info('Saved offline', 'Field will sync when you reconnect.');
        return;
      }
      toast.error(t('errorGeneric'), t('couldNotAddField'));
    },
  });

  if (loading && !payload) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text tone="muted">{t('gatheringFarmIntelligence')}</Text>
        </View>
      </Screen>
    );
  }

  if (isError) {
    const message = error instanceof ApiError ? error.message : 'Unable to load dashboard right now.';
    const statusCode = error instanceof ApiError ? error.statusCode : undefined;

    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <Text variant="headline">{t('couldNotLoadDashboard')}</Text>
          <Text tone="muted" align="center">{message}</Text>
          <Button label={t('retry')} onPress={() => refetch()} fullWidth />
          {statusCode === 401 ? (
            <Button
              label={t('signInAgain')}
              variant="secondary"
              onPress={() => {
                clearAuthQueryCache();
                signOut();
                router.replace('/auth/login');
              }}
              fullWidth
            />
          ) : null}
        </View>
      </Screen>
    );
  }

  if (!payload) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <Text variant="headline">{t('noDashboardData')}</Text>
          <Button label={t('reload')} onPress={() => refetch()} fullWidth />
        </View>
      </Screen>
    );
  }

  const { user, weatherAlert, priorityTask, soilHealth, weatherForecast } = payload;
  const aiInsights = aiInsightsData?.aiInsights ?? payload.aiInsights ?? [];
  const unreadNotifications = payload.unreadNotifications ?? 0;
  const outbreakAlerts = payload.outbreakAlerts ?? [];
  // Prefer the live store profile so a just-saved farm isn't blocked by a stale snapshot.
  const showFullDashboard =
    profileCompleteLocally || Boolean(payload.profileComplete && payload.hasFarmLocation);

  if (!showFullDashboard) {
    return (
      <Screen>
        <Container>
          <Header>
            <Text variant="caption" tone="muted">{getGreeting()}</Text>
            <Text variant="display">{user.name}</Text>
            <Text variant="body" tone="muted">
              {t('finishFarmSetup')}
            </Text>
          </Header>
          <Surface rounded="xl" style={{ marginTop: 16, gap: 16, padding: 24 }}>
            <Sprout size={40} color={theme.colors.primary} />
            <Text variant="headline">{t('completeFarmProfile')}</Text>
            <Text variant="body" tone="muted">
              Add your crops, soil, and farm location so AgroAide can warn you about nearby crop diseases within 5km and give advice for your fields.
            </Text>
            <Button
              label={t('completeFarmDetails')}
              onPress={() => router.push('/auth/complete-farm')}
              fullWidth
            />
          </Surface>
        </Container>
      </Screen>
    );
  }

  return (
    <Screen>
      <Container>
        <Header>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text variant="caption" tone="muted">{getGreeting()}</Text>

              <Text variant="display">{user.name}</Text>
            </View>
            <TouchableOpacity style={{ padding: 10 }} onPress={() => router.push('/(app)/notifications')}>
              <Bell size={24} color={theme.colors.textPrimary} />
              {unreadNotifications > 0 && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#e63946',
                    position: 'absolute',
                    top: 8,
                    right: 8,
                  }}
                />
              )}
            </TouchableOpacity>
          </View>
          <Text variant="body" tone="accent">
            <Leaf size={14} color={theme.colors.primary} /> {user.farmName}
          </Text>
        </Header>

        {weatherAlert ? (
          <LinearGradient colors={weatherAlert.gradient} style={{ borderRadius: 28, padding: 24, marginTop: 8 }}>
            <Badge tone="warning">
              <Text variant="caption" tone="inverse">{weatherAlert.severity} {t('alertLabel')}</Text>
            </Badge>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Text variant="title" tone="inverse">{weatherAlert.title}</Text>
              <Text variant="body" tone="inverse">{weatherAlert.advice}</Text>
            </View>
            <AlertTriangle size={96} color="#ffffff55" style={{ position: 'absolute', right: 20, top: 12 }} />
          </LinearGradient>
        ) : null}

        {outbreakAlerts.length > 0 && (
          <Section>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="headline">{t('diseaseAlerts')}</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/outbreak-map')}>
                <Text variant="caption" tone="accent">{t('viewOutbreakMap')}</Text>
              </TouchableOpacity>
            </View>
            {outbreakAlerts.slice(0, 2).map((alert: any) => (
              <TouchableOpacity key={alert.id} onPress={() => router.push('/(app)/outbreak-map')} activeOpacity={0.7}>
                <Surface
                  rounded="xl"
                  style={{
                    borderLeftWidth: 4,
                    borderLeftColor: '#e63946',
                    gap: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <AlertTriangle size={18} color="#e63946" />
                    <Text variant="headline" style={{ flex: 1 }}>{alert.title}</Text>
                  </View>
                  <Text variant="body" tone="muted" numberOfLines={2}>{alert.message}</Text>
                </Surface>
              </TouchableOpacity>
            ))}
          </Section>
        )}

        <Section>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Text variant="headline">{t('priorityTask')}</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/calendar')}>
              <Text variant="caption" tone="accent">{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/calendar')} activeOpacity={0.8}>
          <Surface rounded="xl" style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
            <ProgressDonut value={priorityTask.progress} size={110} color="#db9534" label={`${priorityTask.progress}%`} subLabel={t('completeLabel')} />
            <View style={{ flex: 1, gap: 6 }}>
              <Text variant="headline">{priorityTask.title}</Text>
              <Text variant="body" tone="muted">{priorityTask.estimatedImpact}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {priorityTask.actionItems.map((item: string) => (
                  <Chip key={item} label={item} tone="info" />
                ))}
              </View>
              </View>
            </Surface>
          </TouchableOpacity>
        </Section>

        {/* My Farms Section */}
        <Section>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headline">{t('myFarms')}</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Chip
                label="+ Add"
                tone="success"
                onPress={() => {
                  setNewFieldCrop(profileCrops[0] ?? '');
                  setWalkAfterSave(true);
                  setShowAddFarmModal(true);
                }}
              />
              <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/farm')}>
                <Text variant="caption" tone="accent">{t('viewAll')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          {(!farmData?.fields || farmData.fields.length === 0) ? (
            <Surface rounded="xl" style={{ padding: 24, alignItems: 'center', gap: 8 }}>
              <Sprout size={32} color={theme.colors.textSecondary} />
              <Text tone="muted">{t('noFarmFieldsYet')}</Text>
              <Button
                label={t('addYourFirstField')}
                variant="secondary"
                onPress={() => {
                  setNewFieldCrop(profileCrops[0] ?? '');
                  setWalkAfterSave(true);
                  setShowAddFarmModal(true);
                }}
              />
            </Surface>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
              {farmData.fields.slice(0, 5).map((field: FarmField) => (
                <TouchableOpacity
                  key={field.id}
                  onPress={() =>
                    router.push({
                      pathname: '/field-detail',
                      params: { fieldId: field.id, fieldName: field.name },
                    })
                  }
                  activeOpacity={0.7}
                >
                  <Surface
                    rounded="xl"
                    style={{
                      width: 160,
                      gap: 8,
                      paddingVertical: 16,
                      paddingHorizontal: 14,
                    }}>
                    <View
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: field.health >= 70 ? '#d1fae5' : '#fef3c7',
                      }}>
                      <Leaf size={18} color={field.health >= 70 ? '#047857' : '#92400e'} />
                    </View>
                    <Text variant="headline" numberOfLines={1}>{field.name}</Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>{field.crop}</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Chip label={`${field.health}%`} tone={field.health >= 70 ? 'success' : 'warning'} />
                      {/* <Chip label={formatAreaWithFt(field.area)} tone="default" /> */}
                    </View>
                  </Surface>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => {
                  setNewFieldCrop(profileCrops[0] ?? '');
                  setWalkAfterSave(true);
                  setShowAddFarmModal(true);
                }}
                activeOpacity={0.7}
              >
                <Surface
                  rounded="xl"
                  style={{
                    width: 160,
                    gap: 8,
                    paddingVertical: 16,
                    paddingHorizontal: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: theme.colors.border,
                    minHeight: 140,
                  }}>
                  <Plus size={28} color={theme.colors.primary} />
                  <Text variant="caption" tone="accent">{t('addFarm')}</Text>
                </Surface>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Section>

        {/* Market Prices Section */}
        <Section>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headline">{t('marketPrices')}</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/market')}>
              <Text variant="caption" tone="accent">{t('viewAll')}</Text>
            </TouchableOpacity>
          </View>
          {(!marketData?.marketPrices || marketData.marketPrices.length === 0) ? (
            <Surface rounded="xl" style={{ padding: 24, alignItems: 'center', gap: 8 }}>
              <Text tone="muted">{t('addCropsForPrices')}</Text>
              <TouchableOpacity onPress={() => router.push('/(app)/market')}>
                <Text variant="caption" tone="accent">{t('openMarket')}</Text>
              </TouchableOpacity>
            </Surface>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
              {marketData.marketPrices.slice(0, 4).map((item: MarketPrice, index: number) => {
                const price = item.price ?? item.pricePerTon;
                const available = item.available !== false && price != null;
                return (
                <TouchableOpacity key={index} onPress={() => router.push('/(app)/market')} activeOpacity={0.7}>
                  <Surface
                    rounded="xl"
                    style={{
                      width: 148,
                      gap: 6,
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                    }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Leaf size={16} color={theme.colors.primary} />
                      <Text variant="headline" numberOfLines={1}>{item.commodity}</Text>
                    </View>
                    <Text variant="title" style={{ fontWeight: '700', fontSize: available ? 18 : 13 }}>
                      {available
                        ? `₦${Number(price).toLocaleString('en-NG')}`
                        : 'No price yet'}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>
                      {available && item.unit ? item.unit : item.location}
                    </Text>
                    <Text variant="caption" tone="muted" numberOfLines={1}>{item.location}</Text>
                    {available ? (
                    <View style={{
                      alignSelf: 'flex-start',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 8,
                      backgroundColor: item.trend === 'up' ? '#d1fae5' : item.trend === 'down' ? '#fde2e2' : '#f3f4f6',
                    }}>
                      <Text variant="caption" style={{
                        color: item.trend === 'up' ? '#047857' : item.trend === 'down' ? '#b91c1c' : '#374151',
                        fontWeight: '600',
                        fontSize: 11,
                      }}>
                        {item.trend === 'up' ? `↑ ${t('rising')}` : item.trend === 'down' ? `↓ ${t('falling')}` : `→ ${t('stable')}`}
                      </Text>
                    </View>
                    ) : null}
                  </Surface>
                </TouchableOpacity>
              );
              })}
              <TouchableOpacity onPress={() => router.push('/(app)/market')} activeOpacity={0.7}>
                <Surface
                  rounded="xl"
                  style={{
                    width: 100,
                    gap: 8,
                    paddingVertical: 16,
                    paddingHorizontal: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderStyle: 'dashed',
                    borderColor: theme.colors.border,
                    minHeight: 120,
                  }}>
                  <ArrowRight size={24} color={theme.colors.primary} />
                  <Text variant="caption" tone="accent">{t('viewAll')}</Text>
                </Surface>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Section>

        <Section>
          <Text variant="headline">{t('soilConditions')}</Text>
          <Text variant="caption" tone="muted" style={{ marginBottom: 4 }}>
            {t('soilOpenMeteoNote')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {soilHealth.map((metric: any) => {
              const palette = toneToColors[metric.tone as SoilTone] || toneToColors.neutral;
              const MetricIcon = soilIconMap[metric.icon] || Cloud;
              return (
                <Surface key={metric.label} rounded="xl" style={{ width: '47%', gap: 12, padding: 16 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: palette.bg,
                    }}>
                    <MetricIcon size={20} color={palette.icon} />
                  </View>
                  <Text variant="caption" tone="muted">{metric.label}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                    <Text variant="title">{metric.value}</Text>
                    <Text variant="caption" tone="muted">{metric.unit}</Text>
                  </View>
                </Surface>
              );
            })}
          </View>
        </Section>

        <Section>
          <Text variant="headline">{t('forecast')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
            {weatherForecast.map((day: any, index: number) => {
              const WeatherIcon = weatherIconMap[day.icon] || Cloud;
              return (
                <Surface
                  key={day.day + index}
                  rounded="xl"
                  style={{
                    width: 120,
                    gap: 10,
                    paddingVertical: 18,
                    alignItems: 'center',
                    backgroundColor: index === 0 ? '#1f2937' : undefined,
                  }}>
                  <Text variant="caption" tone={index === 0 ? 'inverse' : 'muted'}>{day.day}</Text>
                  <WeatherIcon size={28} color={index === 0 ? '#fcd34d' : theme.colors.textSecondary} />
                  <Text variant="headline" tone={index === 0 ? 'inverse' : 'default'}>{day.high}°</Text>
                  <Text variant="caption" tone={index === 0 ? 'inverse' : 'muted'}>{day.low}°</Text>
                  {(day.precipitationProbability > 0 || day.precipitation > 0) ? (
                    <Text variant="caption" tone="accent">
                      <Droplets size={10} color="#38bdf8" />{' '}
                      {day.precipitationProbability > 0
                        ? `${Math.round(day.precipitationProbability)}% rain`
                        : `${day.precipitation}mm`}
                    </Text>
                  ) : null}
                </Surface>
              );
            })}
          </ScrollView>
        </Section>

        {aiInsights.length > 0 ? (
        <Section style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color={theme.colors.primary} />
            <Text variant="headline">{t('aiInsights')}</Text>
          </View>
          <View style={{ gap: 12 }}>
            {aiInsights.map((tip: any) => (
              <Surface
                key={tip.id}
                rounded="xl"
                style={{
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  gap: 8,
                }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text variant="headline" style={{ flex: 1 }}>{tip.title}</Text>
                  <Badge tone="success">
                    <Text variant="caption" tone="accent">{t('today')}</Text>
                  </Badge>
                </View>
                <Text tone="muted">{tip.description}</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 4 }}
                  onPress={() => router.push('/(app)/(tabs)/advisor')}
                >
                  <Text variant="caption" tone="accent">{t('askAiMore')}</Text>
                  <ArrowRight size={14} color={theme.colors.primary} />
                </TouchableOpacity>
              </Surface>
            ))}
          </View>
        </Section>
        ) : null}
      </Container>

      {/* Add Farm Modal */}
      <Modal visible={showAddFarmModal} transparent animationType="slide" onRequestClose={() => setShowAddFarmModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ModalOverlay>
            <ModalContent>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={{ gap: 16 }}>
                  <Text variant="headline">{t('addNewFarmField')}</Text>
                  <InputField label={t('fieldName')} value={newFieldName} onChangeText={setNewFieldName} placeholder="e.g. North Block" />
                  <Text variant="caption" tone="muted">{t('cropPlantedOnField')}</Text>
                  {profileCrops.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {profileCrops.map((crop) => (
                        <Chip
                          key={crop}
                          label={crop}
                          tone={newFieldCrop === crop ? 'success' : 'default'}
                          onPress={() => setNewFieldCrop(crop)}
                        />
                      ))}
                    </View>
                  ) : (
                    <InputField
                      label={t('cropLabel')}
                      value={newFieldCrop}
                      onChangeText={setNewFieldCrop}
                      placeholder={t('addCropsInSettingsFirst')}
                    />
                  )}
                  <InputField
                    label={t('areaEstimateOptional')}
                    value={newFieldArea}
                    onChangeText={setNewFieldArea}
                    keyboardType="decimal-pad"
                    placeholder={t('leaveBlankWalkBoundary')}
                  />
                  {newFieldArea ? (
                    <Text variant="caption" tone="muted">{formatAreaWithFt(parseFloat(newFieldArea) || 0)}</Text>
                  ) : null}
                  <Chip
                    label={walkAfterSave ? `✓ ${t('walkBoundaryAfterSave')}` : t('skipWalkForNow')}
                    tone={walkAfterSave ? 'info' : 'default'}
                    onPress={() => setWalkAfterSave((v) => !v)}
                  />
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Button label={t('cancel')} variant="ghost" onPress={() => setShowAddFarmModal(false)} style={{ flex: 1 }} />
                    <Button
                      label={t('addField')}
                      onPress={() => addFieldMutation.mutate()}
                      loading={addFieldMutation.isPending}
                      disabled={!newFieldName || !newFieldCrop}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              </ScrollView>
            </ModalContent>
          </ModalOverlay>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  );
}
