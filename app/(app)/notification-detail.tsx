import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { ActivityIndicator, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from '@/design-system/styled';

import { useToast } from '@/components/Toast';
import { Button, Chip, Surface, Text } from '@/design-system/components';
import { calendarApi } from '@/services/calendarApi';
import { notificationApi } from '@/services/notificationApi';
import { useAppStore } from '@/store/useAppStore';
import { scheduleLocalPlantingReminders } from '@/utils/localPlantingReminders';
import { sanitizeNotificationText } from '@/utils/sanitizeNotificationText';

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

function formatPlantDate(value?: string): string {
  if (!value) return '';
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function NotificationDetailScreen() {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const token = useAppStore((s) => s.accessToken) ?? '';
  const params = useLocalSearchParams<{
    id?: string;
    type?: string;
    title?: string;
    message?: string;
    crop?: string;
    analysis?: string;
    bestPlantDate?: string;
    canSetReminder?: string;
    watchId?: string;
    fieldId?: string;
    harvestStart?: string;
    harvestEnd?: string;
    plantedAt?: string;
    location?: string;
  }>();

  const notificationId = params.id ? Number(params.id) : NaN;

  const { data, isLoading } = useQuery({
    queryKey: ['notification', notificationId],
    queryFn: () => notificationApi.getOne(notificationId, token),
    enabled: Boolean(token && Number.isFinite(notificationId)),
  });

  const remote = data?.notification;
  const remoteData = remote?.data ?? {};

  const title = String(remote?.title || params.title || 'Alert');
  const type = String(remote?.type || params.type || '');
  const crop = String(remoteData.crop || params.crop || '');
  const analysis = String(remoteData.analysis || params.analysis || '');
  const location = String(remoteData.location || remoteData.farmLocation || params.location || '');
  const bestPlantDate = String(remoteData.bestPlantDate || remoteData.plantOn || params.bestPlantDate || '');
  const harvestStart = String(remoteData.harvestStart || params.harvestStart || '');
  const harvestEnd = String(remoteData.harvestEnd || params.harvestEnd || '');
  const plantedAt = String(remoteData.plantedAt || params.plantedAt || '');
  const fieldId = String(remoteData.fieldId || params.fieldId || '');
  const watchId = String(remoteData.watchId || params.watchId || '');
  const canSetReminder =
    remoteData.canSetReminder === true ||
    remoteData.canSetReminder === 'true' ||
    params.canSetReminder === 'true' ||
    params.canSetReminder === '1';

  const fallbackAdvice = useMemo(() => {
    if (crop && bestPlantDate) {
      return `Good time to plant ${crop}${location ? ` around ${location}` : ''}. Best planting date: ${formatPlantDate(bestPlantDate)}.`;
    }
    return title;
  }, [bestPlantDate, crop, location, title]);

  const message = sanitizeNotificationText(String(remote?.message || params.message || ''), fallbackAdvice);
  const isHarvest = type === 'harvest_estimate' || type === 'harvest_reminder' || analysis === 'harvest_ready';

  const reminderMutation = useMutation({
    mutationFn: async () => {
      const res = await calendarApi.setPlantingReminder(token, {
        notificationId: Number.isFinite(notificationId) ? notificationId : undefined,
        watchId: watchId ? Number(watchId) : undefined,
        crop: crop || 'Crop',
        plantOn: bestPlantDate,
      });
      await scheduleLocalPlantingReminders(res.localSchedule ?? []);
      return res;
    },
    onSuccess: () => {
      toast.success('Reminder set', 'You will be notified 2 days before and on planting day.');
    },
    onError: () => toast.error('Error', 'Could not set planting reminder.'),
  });

  return (
    <Screen edges={['top', 'bottom']}>
      <HeaderBar>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Text variant="headline" style={{ color: '#fff', fontWeight: '700', flex: 1 }}>
          Notification
        </Text>
      </HeaderBar>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        {isLoading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : null}

        <Surface rounded="xl" style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {crop ? <Chip label={crop} tone="success" /> : null}
            {analysis ? <Chip label={String(analysis).replace(/_/g, ' ')} tone="info" /> : null}
          </View>
          <Text variant="headline">{title}</Text>
          {location ? (
            <Text variant="caption" tone="muted">
              For your farm near {location}
            </Text>
          ) : null}
          <Text variant="body">{message}</Text>
          {bestPlantDate ? (
            <Text variant="caption" tone="muted">
              Suggested planting date: {formatPlantDate(bestPlantDate)}
            </Text>
          ) : null}
          {plantedAt ? (
            <Text variant="caption" tone="muted">
              Planting date you entered: {formatPlantDate(plantedAt)}
            </Text>
          ) : null}
          {harvestStart ? (
            <Text variant="caption" tone="muted">
              Estimated harvest window: {formatPlantDate(harvestStart)}
              {harvestEnd ? ` to ${formatPlantDate(harvestEnd)}` : ''}
            </Text>
          ) : null}
          {analysis === 'season_passed' ? (
            <Text variant="caption" tone="muted">
              This crop stays on your watch list for next year, but you cannot plant it again this season.
            </Text>
          ) : null}
          {analysis === 'invalid' ? (
            <Text variant="caption" tone="muted">
              We removed this entry from your crop watches because it did not look like a valid crop.
            </Text>
          ) : null}
          {isHarvest ? (
            <Text variant="caption" tone="muted">
              Based on the planting date you entered, this is advice from your personalized AI advisor. Open the field to edit the start date, or open the calendar to see the estimated harvest days.
            </Text>
          ) : null}
        </Surface>

        {canSetReminder && bestPlantDate ? (
          <Button
            label="Set reminder"
            onPress={() => reminderMutation.mutate()}
            loading={reminderMutation.isPending}
            fullWidth
          />
        ) : null}

        {fieldId ? (
          <>
            {isHarvest ? (
              <Button
                label="Mark crop harvested"
                onPress={() =>
                  router.push({
                    pathname: '/(app)/field-detail',
                    params: {
                      fieldId,
                      fieldName: crop || 'Field',
                      openHarvest: '1',
                    },
                  })
                }
                fullWidth
              />
            ) : null}
            <Button
              label="Open field"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/(app)/field-detail',
                  params: { fieldId, fieldName: crop || 'Field' },
                })
              }
              fullWidth
            />
          </>
        ) : null}

        <Button
          label="Open calendar"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: '/(app)/(tabs)/calendar',
              params: {
                focusDate: harvestStart || bestPlantDate || '',
                focusCrop: crop || '',
              },
            })
          }
          fullWidth
        />

        {isHarvest ? (
          <Button
            label="Ask AI advisor"
            onPress={() => router.push('/(app)/(tabs)/advisor')}
            fullWidth
          />
        ) : null}
      </ScrollView>
    </Screen>
  );
}
