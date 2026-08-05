import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { useToast } from '@/components/Toast';
import { Button, Chip, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { calendarApi } from '@/services/calendarApi';
import { useAppStore } from '@/store/useAppStore';
import { scheduleLocalPlantingReminders } from '@/utils/localPlantingReminders';

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

export default function NotificationDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
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
  }>();

  const canSetReminder = params.canSetReminder === 'true' || params.canSetReminder === '1';
  const bestPlantDate = params.bestPlantDate;
  const analysis = params.analysis;

  const reminderMutation = useMutation({
    mutationFn: async () => {
      const res = await calendarApi.setPlantingReminder(token, {
        notificationId: params.id ? Number(params.id) : undefined,
        watchId: params.watchId ? Number(params.watchId) : undefined,
        crop: String(params.crop || 'Crop'),
        plantOn: String(bestPlantDate),
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
        <Surface rounded="xl" style={{ gap: 10 }}>
          {params.crop ? <Chip label={String(params.crop)} tone="success" /> : null}
          {analysis ? <Chip label={String(analysis).replace('_', ' ')} tone="info" /> : null}
          <Text variant="headline">{params.title || 'Alert'}</Text>
          <Text variant="body">{params.message || ''}</Text>
          {bestPlantDate ? (
            <Text variant="caption" tone="muted">
              Suggested planting date: {bestPlantDate}
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
        </Surface>

        {canSetReminder && bestPlantDate ? (
          <Button
            label="Set reminder"
            onPress={() => reminderMutation.mutate()}
            loading={reminderMutation.isPending}
            fullWidth
          />
        ) : null}

        <Button
          label="Open calendar"
          variant="secondary"
          onPress={() =>
            router.push({
              pathname: '/(app)/(tabs)/calendar',
              params: bestPlantDate ? { focusDate: String(bestPlantDate), focusCrop: String(params.crop || '') } : {},
            })
          }
          fullWidth
        />
      </ScrollView>
    </Screen>
  );
}
