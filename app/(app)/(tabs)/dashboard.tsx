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
    MoreHorizontal,
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
import { ActivityIndicator, Alert, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from 'styled-components/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button, Chip, InputField, ProgressDonut, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { dashboardApi } from '@/services/dashboardApi';
import { farmApi, type FarmField } from '@/services/farmApi';
import { ApiError } from '@/services/apiClient';
import { useAppStore } from '@/store/useAppStore';

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
  const queryClient = useQueryClient();
  const accessToken = useAppStore((state) => state.accessToken);
  const signOut = useAppStore((state) => state.signOut);

  const [showAddFarmModal, setShowAddFarmModal] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldCrop, setNewFieldCrop] = useState('');
  const [newFieldArea, setNewFieldArea] = useState('');

  const {
    data: payload,
    isLoading: loading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['dashboardSnapshot'],
    queryFn: () => dashboardApi.getSnapshot(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });

  const { data: farmData } = useQuery({
    queryKey: ['farmOverview'],
    queryFn: () => farmApi.getOverview(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });

  const addFieldMutation = useMutation({
    mutationFn: () =>
      farmApi.addField(accessToken ?? '', {
        name: newFieldName,
        crop: newFieldCrop,
        areaHectares: parseFloat(newFieldArea) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farmOverview'] });
      setShowAddFarmModal(false);
      setNewFieldName(''); setNewFieldCrop(''); setNewFieldArea('');
    },
    onError: () => Alert.alert('Error', 'Could not add farm field.'),
  });

  if (loading || isFetching) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text tone="muted">Gathering farm intelligence...</Text>
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
          <Text variant="headline">Couldn't load dashboard</Text>
          <Text tone="muted" align="center">{message}</Text>
          <Button label="Retry" onPress={() => refetch()} fullWidth />
          {statusCode === 401 ? (
            <Button
              label="Sign in again"
              variant="secondary"
              onPress={() => { signOut(); router.replace('/auth/login'); }}
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
          <Text variant="headline">No dashboard data</Text>
          <Button label="Reload" onPress={() => refetch()} fullWidth />
        </View>
      </Screen>
    );
  }

  const { user, weatherAlert, priorityTask, soilHealth, weatherForecast, aiInsights } = payload;
  const unreadNotifications = (payload as any).unreadNotifications ?? 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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
              <Text variant="caption" tone="inverse">{weatherAlert.severity} alert</Text>
            </Badge>
            <View style={{ marginTop: 12, gap: 8 }}>
              <Text variant="title" tone="inverse">{weatherAlert.title}</Text>
              <Text variant="body" tone="inverse">{weatherAlert.advice}</Text>
            </View>
            <AlertTriangle size={96} color="#ffffff55" style={{ position: 'absolute', right: 20, top: 12 }} />
          </LinearGradient>
        ) : null}

        <Section>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Text variant="headline">Priority task</Text>
          </View>
          <Surface rounded="xl" style={{ flexDirection: 'row', gap: 20, alignItems: 'center' }}>
            <ProgressDonut value={priorityTask.progress} size={110} color="#db9534" label={`${priorityTask.progress}%`} subLabel="Complete" />
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
        </Section>

        {/* My Farms Section */}
        <Section>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headline">My farms</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Chip label="+ Add" tone="success" onPress={() => setShowAddFarmModal(true)} />
              <TouchableOpacity onPress={() => router.push('/(app)/(tabs)/farm')}>
                <Text variant="caption" tone="accent">View all</Text>
              </TouchableOpacity>
            </View>
          </View>
          {(!farmData?.fields || farmData.fields.length === 0) ? (
            <Surface rounded="xl" style={{ padding: 24, alignItems: 'center', gap: 8 }}>
              <Sprout size={32} color={theme.colors.textSecondary} />
              <Text tone="muted">No farm fields yet.</Text>
              <Button label="Add your first farm" variant="secondary" onPress={() => setShowAddFarmModal(true)} />
            </Surface>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingRight: 16 }}>
              {farmData.fields.slice(0, 5).map((field: FarmField) => (
                <TouchableOpacity key={field.id} onPress={() => router.push('/(app)/(tabs)/farm')} activeOpacity={0.7}>
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
                      <Chip label={`${field.area} ha`} tone="default" />
                    </View>
                  </Surface>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setShowAddFarmModal(true)} activeOpacity={0.7}>
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
                  <Text variant="caption" tone="accent">Add farm</Text>
                </Surface>
              </TouchableOpacity>
            </ScrollView>
          )}
        </Section>

        <Section>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headline">Soil & conditions</Text>
            <MoreHorizontal size={20} color={theme.colors.textSecondary} />
          </View>
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
          <Text variant="headline">7-day forecast</Text>
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
                  {day.precipitation > 0 ? (
                    <Text variant="caption" tone="accent">
                      <Droplets size={10} color="#38bdf8" /> {day.precipitation}mm
                    </Text>
                  ) : null}
                </Surface>
              );
            })}
          </ScrollView>
        </Section>

        <Section style={{ marginBottom: 32 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color={theme.colors.primary} />
            <Text variant="headline">AI insights</Text>
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
                    <Text variant="caption" tone="accent">Today</Text>
                  </Badge>
                </View>
                <Text tone="muted">{tip.description}</Text>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingTop: 4 }}
                  onPress={() => router.push('/(app)/(tabs)/advisor')}
                >
                  <Text variant="caption" tone="accent">Ask AI more</Text>
                  <ArrowRight size={14} color={theme.colors.primary} />
                </TouchableOpacity>
              </Surface>
            ))}
          </View>
        </Section>
      </Container>

      {/* Add Farm Modal */}
      <Modal visible={showAddFarmModal} transparent animationType="slide" onRequestClose={() => setShowAddFarmModal(false)}>
        <ModalOverlay>
          <ModalContent>
            <Text variant="headline">Add new farm field</Text>
            <InputField label="Field name" value={newFieldName} onChangeText={setNewFieldName} placeholder="e.g. North Block" />
            <InputField label="Crop" value={newFieldCrop} onChangeText={setNewFieldCrop} placeholder="e.g. Maize" />
            <InputField label="Area (hectares)" value={newFieldArea} onChangeText={setNewFieldArea} keyboardType="decimal-pad" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button label="Cancel" variant="outline" onPress={() => setShowAddFarmModal(false)} style={{ flex: 1 }} />
              <Button
                label="Add farm"
                onPress={() => addFieldMutation.mutate()}
                loading={addFieldMutation.isPending}
                disabled={!newFieldName || !newFieldCrop}
                style={{ flex: 1 }}
              />
            </View>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </Screen>
  );
}
