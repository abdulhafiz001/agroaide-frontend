import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { useTranslation } from '@/i18n/useTranslation';
import { calendarApi, type CalendarTask } from '@/services/calendarApi';
import { useAppStore } from '@/store/useAppStore';

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Container = styled(ScrollView).attrs(({ theme }) => ({
  contentContainerStyle: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl + 60,
  },
}))``;

const Section = styled.View`
  margin-top: ${({ theme }) => theme.spacing.lg}px;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const TaskCard = styled(Surface)<{ completed: boolean }>`
  gap: 8px;
  opacity: ${({ completed }) => (completed ? 0.65 : 1)};
`;

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
  max-height: 85%;
`;

const FAB = styled(TouchableOpacity)`
  position: absolute;
  bottom: 90px;
  right: 20px;
  width: 56px;
  height: 56px;
  border-radius: 28px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primary};
  elevation: 4;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 4px;
`;

const periods = ['morning', 'afternoon', 'evening'] as const;
const impacts = ['low', 'medium', 'high'] as const;

const impactColors: Record<string, string> = {
  high: '#e63946',
  medium: '#db9534',
  low: '#57b346',
};

type WatchItem = {
  id: string;
  crop: string;
  notifyWhenPlantingWindow: boolean;
  lastNotifiedOn: string | null;
  status?: string;
  bestPlantDate?: string | null;
  lastAnalysisStatus?: string | null;
};

export default function CalendarScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { t } = useTranslation();
  const token = useAppStore((s) => s.accessToken) ?? '';
  const queryClient = useQueryClient();
  const { focusDate, focusCrop } = useLocalSearchParams<{ focusDate?: string; focusCrop?: string }>();

  const periodLabel = (p: string) =>
    p === 'morning' ? t('periodMorning') : p === 'afternoon' ? t('periodAfternoon') : t('periodEvening');
  const impactLabel = (i: string) =>
    i === 'low' ? t('impactLow') : i === 'medium' ? t('impactMedium') : t('impactHigh');

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState<string>('morning');
  const [duration, setDuration] = useState('30');
  const [impact, setImpact] = useState<string>('medium');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [unwatchTarget, setUnwatchTarget] = useState<WatchItem | null>(null);

  useEffect(() => {
    if (focusDate && typeof focusDate === 'string') {
      setSelectedDate(focusDate);
    }
  }, [focusDate]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['calendar', selectedDate],
    queryFn: () => calendarApi.getCalendar(token, selectedDate),
    enabled: Boolean(token),
  });

  const seasonalQuery = useQuery({
    queryKey: ['seasonalSuggestions'],
    queryFn: () => calendarApi.getSeasonalSuggestions(token),
    enabled: Boolean(token),
  });

  const watchesQuery = useQuery({
    queryKey: ['cropWatches'],
    queryFn: () => calendarApi.listCropWatches(token),
    enabled: Boolean(token),
  });

  const [customWatchCrop, setCustomWatchCrop] = useState('');

  const WATCHABLE_CROPS = ['Maize', 'Cassava', 'Yam', 'Tomato', 'Rice', 'Sorghum', 'Millet', 'Cowpea', 'Beans'];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
    queryClient.invalidateQueries({ queryKey: ['dashboardSnapshot'] });
    queryClient.invalidateQueries({ queryKey: ['cropWatches'] });
  };

  const watches: WatchItem[] = watchesQuery.data?.watches ?? [];

  const findWatch = (crop: string) =>
    watches.find((w) => {
      const a = w.crop.toLowerCase();
      const b = crop.toLowerCase();
      if (a === b) return true;
      // Beans ↔ Cowpea (backend alias)
      if ((a === 'cowpea' || a === 'beans') && (b === 'cowpea' || b === 'beans')) return true;
      return false;
    });

  const analysisLabel = (w: WatchItem) => {
    if (w.lastAnalysisStatus === 'window_open' && w.bestPlantDate) {
      return `Plant by ${w.bestPlantDate}`;
    }
    if (w.lastAnalysisStatus === 'season_passed') return 'Season passed this year';
    if (w.lastAnalysisStatus === 'waiting') return 'Waiting for planting window';
    if (w.bestPlantDate) return `Plant by ${w.bestPlantDate}`;
    return 'Watching — analysis pending';
  };

  const acceptSuggestionMutation = useMutation({
    mutationFn: async (suggestion: { crop: string; plantingWindowActive: boolean }) => {
      return calendarApi.createTask(token, {
        title: `Start planting ${suggestion.crop}`,
        description: `Seasonal suggestion for your ${seasonalQuery.data?.zoneLabel ?? 'zone'}. Planting window is open.`,
        scheduledDate: selectedDate,
        period: 'morning',
        durationMinutes: 60,
        impact: 'high',
      });
    },
    onSuccess: () => {
      invalidate();
      toast.success(t('taskAdded'), t('plantingTaskAdded'));
    },
    onError: () => toast.error(t('errorGeneric'), t('couldNotCreatePlanting')),
  });

  const watchMutation = useMutation({
    mutationFn: (crop: string) => calendarApi.addCropWatch(token, { crop, notifyWhenPlantingWindow: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cropWatches'] });
      toast.success(t('watching'), t('watchNotifyHint'));
    },
    onError: () => toast.error(t('errorGeneric'), t('couldNotSaveWatch')),
  });

  const unwatchMutation = useMutation({
    mutationFn: (id: string) => calendarApi.removeCropWatch(token, id),
    onSuccess: () => {
      invalidate();
      setUnwatchTarget(null);
      toast.success('Unwatched', 'Crop removed from your watch list.');
    },
    onError: () => toast.error(t('errorGeneric'), 'Could not remove crop watch.'),
  });

  const createMutation = useMutation({
    mutationFn: () => calendarApi.createTask(token, {
      title, description: description || undefined, scheduledDate: selectedDate,
      period, durationMinutes: parseInt(duration) || 30, impact,
    }),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: () => toast.error(t('errorGeneric'), t('couldNotCreateTask')),
  });

  const updateMutation = useMutation({
    mutationFn: () => calendarApi.updateTask(token, editingTask!.id, {
      title, description: description || undefined, scheduledDate: selectedDate,
      period, durationMinutes: parseInt(duration) || 30, impact,
    }),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: () => toast.error(t('errorGeneric'), t('couldNotUpdateTask')),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      calendarApi.markTaskComplete(token, id, completed),
    onSuccess: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarApi.deleteTask(token, id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success(t('deleted'), t('taskRemoved'));
    },
    onError: () => toast.error(t('errorGeneric'), t('couldNotDeleteTask')),
  });

  const openAdd = () => {
    setEditingTask(null);
    setTitle(''); setDescription(''); setPeriod('morning'); setDuration('30'); setImpact('medium');
    setShowModal(true);
  };

  const openEdit = (task: CalendarTask) => {
    setEditingTask(task);
    setTitle(task.title); setDescription(task.description ?? ''); setPeriod(task.period); setDuration(String(task.durationMinutes)); setImpact(task.impact);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingTask(null); };

  const confirmDelete = (id: string, name: string) => {
    setDeleteTarget({ id, name });
  };

  const dayTasks = data?.dayPlan ?? [];
  const dayReminders = data?.dayReminders ?? [];
  const markedDates = { ...(data?.markedDates ?? {}) } as Record<string, any>;

  // Ensure analyzed watch plant dates show as green dots even before calendar refetch.
  for (const w of watches) {
    if (w.bestPlantDate) {
      markedDates[w.bestPlantDate] = {
        ...(markedDates[w.bestPlantDate] || {}),
        marked: true,
        dotColor: '#166534',
      };
    }
  }

  const calendarMarked = {
    ...markedDates,
    [selectedDate]: {
      ...(markedDates[selectedDate] || {}),
      selected: true,
      selectedColor: theme.colors.primary,
    },
  };

  return (
    <Screen>
      <Container>
        <View style={{ paddingTop: 16, gap: 4 }}>
          <Text variant="display">{t('calendarTitle')}</Text>
          <Text variant="body" tone="muted">{t('planTrackActivities')}</Text>
        </View>

        <Section>
          <Surface rounded="xl" style={{ gap: 10, backgroundColor: `${theme.colors.primary}12` }}>
            <Text variant="eyebrow" tone="accent">
              {t('seasonLabel')} · {seasonalQuery.data?.zoneLabel ?? '…'}
            </Text>
            <Text variant="headline">
              {seasonalQuery.data?.season?.isRainy ? t('rainySeasonWindow') : t('drySeasonWindow')}
            </Text>
            <Text variant="caption" tone="muted">
              {t('seasonalAutoNote')}
            </Text>
            {(seasonalQuery.data?.suggestions ?? [])
              .filter((s) => s.plantingWindowActive)
              .map((s) => (
                <Surface key={s.crop} rounded="lg" style={{ gap: 8 }}>
                  <Text variant="headline">{t('itsTimeFor')} {s.crop}</Text>
                  <Text variant="caption" tone="muted">
                    {t('plantingMonths')}: {(s.plantingMonths ?? []).join(', ')}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <Chip
                      label={t('addPlantingTask')}
                      tone="success"
                      onPress={() => acceptSuggestionMutation.mutate(s)}
                    />
                    <Chip
                      label={t('watchAlerts')}
                      tone="info"
                      onPress={() => watchMutation.mutate(s.crop)}
                    />
                  </View>
                </Surface>
              ))}
            {(seasonalQuery.data?.suggestions ?? []).filter((s) => s.plantingWindowActive).length === 0 ? (
              <Text variant="caption" tone="muted">
                {t('noPlantingWindows')}
              </Text>
            ) : null}
          </Surface>
        </Section>

        <Section>
          <Text variant="headline">{t('cropWatches')}</Text>
          <Text variant="caption" tone="muted">
            {t('cropWatchesHint')}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {WATCHABLE_CROPS.map((crop) => {
              const existing = findWatch(crop);
              return (
                <Chip
                  key={crop}
                  label={existing ? `✓ ${crop}` : crop}
                  tone={existing ? 'success' : 'default'}
                  onPress={() => {
                    if (existing) setUnwatchTarget(existing);
                    else watchMutation.mutate(crop);
                  }}
                />
              );
            })}
            {watches
              .filter(
                (w) =>
                  !WATCHABLE_CROPS.some(
                    (c) =>
                      c.toLowerCase() === w.crop.toLowerCase() ||
                      ((c === 'Beans' || c === 'Cowpea') &&
                        (w.crop.toLowerCase() === 'beans' || w.crop.toLowerCase() === 'cowpea')),
                  ),
              )
              .map((w) => (
                <Chip
                  key={w.id}
                  label={`✓ ${w.crop}`}
                  tone="success"
                  onPress={() => setUnwatchTarget(w)}
                />
              ))}
          </View>

          {watches.length > 0 ? (
            <View style={{ gap: 8, marginTop: 4 }}>
              {watches.map((w) => (
                <TouchableOpacity key={w.id} onPress={() => setUnwatchTarget(w)} activeOpacity={0.7}>
                  <Surface
                    rounded="lg"
                    style={{
                      gap: 4,
                      borderWidth: focusCrop && w.crop.toLowerCase() === String(focusCrop).toLowerCase() ? 1.5 : 0,
                      borderColor: theme.colors.primary,
                    }}>
                    <Text variant="headline">{w.crop}</Text>
                    <Text variant="caption" tone="muted">
                      {analysisLabel(w)}
                    </Text>
                    {w.bestPlantDate ? (
                      <Chip
                        label={`Calendar: ${w.bestPlantDate}`}
                        tone="success"
                        onPress={() => setSelectedDate(w.bestPlantDate!)}
                      />
                    ) : null}
                  </Surface>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <InputField
                label={t('addAnotherCrop')}
                value={customWatchCrop}
                onChangeText={setCustomWatchCrop}
                placeholder={t('groundnutPlaceholder')}
              />
            </View>
            <Button
              label={t('watch')}
              onPress={() => {
                const crop = customWatchCrop.trim();
                if (!crop) return;
                watchMutation.mutate(crop);
                setCustomWatchCrop('');
              }}
              loading={watchMutation.isPending}
              disabled={!customWatchCrop.trim()}
            />
          </View>
        </Section>

        <Section>
          <Calendar
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={calendarMarked}
            markingType="dot"
            theme={{
              todayTextColor: theme.colors.primary,
              selectedDayBackgroundColor: theme.colors.primary,
              arrowColor: theme.colors.primary,
              dotColor: '#db9534',
              calendarBackground: 'transparent',
              textDayFontFamily: 'Inter',
              textMonthFontFamily: 'Inter',
              textDayHeaderFontFamily: 'Inter',
              dayTextColor: theme.colors.textPrimary,
              monthTextColor: theme.colors.textPrimary,
              textSectionTitleColor: theme.colors.textSecondary,
            }}
          />
        </Section>

        <Section>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headline">
              {selectedDate === today ? t('todaysTasks') : `${t('tasksFor')} ${selectedDate}`}
            </Text>
            <TouchableOpacity onPress={openAdd}>
              <Chip label={`+ ${t('addTask')}`} tone="success" />
            </TouchableOpacity>
          </View>

          {dayReminders.length > 0 ? (
            <View style={{ gap: 8 }}>
              {dayReminders.map((reminder) => (
                <Surface key={reminder.id} rounded="xl" style={{ gap: 6, borderWidth: 1, borderColor: '#3b82f6' }}>
                  <Chip label="Planting reminder" tone="info" />
                  <Text variant="headline">{reminder.title}</Text>
                  <Text variant="caption" tone="muted">
                    {reminder.description}
                  </Text>
                </Surface>
              ))}
            </View>
          ) : null}

          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : dayTasks.length === 0 && dayReminders.length === 0 ? (
            <Surface variant="muted" style={{ padding: 24, alignItems: 'center', gap: 8, borderRadius: 16 }}>
              <Ionicons name="calendar-outline" size={32} color={theme.colors.textSecondary} />
              <Text tone="muted">{t('noTasksForDay')}</Text>
              <Button label={t('addTask')} variant="secondary" onPress={openAdd} />
            </Surface>
          ) : dayTasks.length === 0 ? null : (
            dayTasks.map((task) => (
              <TaskCard key={task.id} rounded="xl" completed={task.completed}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text
                      variant="headline"
                      style={task.completed ? { textDecorationLine: 'line-through' } : undefined}
                    >
                      {task.title}
                    </Text>
                    {task.description ? (
                      <Text variant="caption" tone="muted">{task.description}</Text>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => openEdit(task)}>
                      <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete(task.id, task.title)}>
                      <Ionicons name="trash-outline" size={20} color="#e63946" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Chip label={periodLabel(task.period)} tone="info" />
                  <Chip label={`${task.durationMinutes} min`} tone="default" />
                  <Chip
                    label={impactLabel(task.impact)}
                    tone={task.impact === 'high' ? 'danger' : task.impact === 'medium' ? 'warning' : 'success'}
                  />
                </View>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4 }}
                  onPress={() => completeMutation.mutate({ id: task.id, completed: !task.completed })}
                >
                  <Ionicons
                    name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={task.completed ? '#2eb873' : theme.colors.textSecondary}
                  />
                  <Text variant="caption" tone={task.completed ? 'accent' : 'muted'}>
                    {task.completed ? t('completed') : t('markComplete')}
                  </Text>
                </TouchableOpacity>
              </TaskCard>
            ))
          )}
        </Section>
      </Container>

      <FAB onPress={openAdd}>
        <Ionicons name="add" size={28} color="#fff" />
      </FAB>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ModalOverlay>
            <ModalContent>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={{ gap: 16 }}>
                  <Text variant="headline">{editingTask ? t('editTask') : t('newTask')}</Text>
                  <InputField label={t('titleLabel')} value={title} onChangeText={setTitle} placeholder={t('inspectMaizePlaceholder')} />
                  <InputField
                    label={t('descriptionOptional')}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t('addDetailsPlaceholder')}
                    multiline
                    numberOfLines={2}
                  />
                  <Text variant="caption" tone="muted">{t('dateLabel')}: {selectedDate}</Text>
                  <Text variant="caption" tone="muted">{t('timeOfDay')}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {periods.map((p) => (
                      <Chip key={p} label={periodLabel(p)} tone={period === p ? 'success' : 'default'} onPress={() => setPeriod(p)} />
                    ))}
                  </View>
                  <InputField label={t('durationMinutes')} value={duration} onChangeText={setDuration} keyboardType="number-pad" />
                  <Text variant="caption" tone="muted">{t('priority')}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {impacts.map((i) => (
                      <Chip key={i} label={impactLabel(i)} tone={impact === i ? 'success' : 'default'} onPress={() => setImpact(i)} />
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    <Button label={t('cancel')} variant="ghost" onPress={closeModal} style={{ flex: 1 }} />
                    <Button
                      label={editingTask ? t('update') : t('addTask')}
                      onPress={() => (editingTask ? updateMutation.mutate() : createMutation.mutate())}
                      loading={createMutation.isPending || updateMutation.isPending}
                      disabled={!title}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              </ScrollView>
            </ModalContent>
          </ModalOverlay>
        </KeyboardAvoidingView>
      </Modal>

      <ConfirmModal
        visible={Boolean(deleteTarget)}
        title={t('deleteTaskConfirm')}
        message={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This cannot be undone.`}
        confirmLabel={t('deleteTask')}
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
      />

      <ConfirmModal
        visible={Boolean(unwatchTarget)}
        title={`Unwatch ${unwatchTarget?.crop ?? 'crop'}?`}
        message={
          unwatchTarget
            ? `${analysisLabel(unwatchTarget)}.${
                unwatchTarget.bestPlantDate
                  ? ` Suggested plant date ${unwatchTarget.bestPlantDate} will leave the calendar.`
                  : ''
              } Stop watching this crop?`
            : ''
        }
        confirmLabel="Unwatch"
        cancelLabel="Keep watching"
        loading={unwatchMutation.isPending}
        onCancel={() => setUnwatchTarget(null)}
        onConfirm={() => {
          if (unwatchTarget) unwatchMutation.mutate(unwatchTarget.id);
        }}
      />
    </Screen>
  );
}
