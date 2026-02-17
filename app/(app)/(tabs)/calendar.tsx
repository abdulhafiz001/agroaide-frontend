import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
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

export default function CalendarScreen() {
  const theme = useTheme();
  const token = useAppStore((s) => s.accessToken) ?? '';
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<CalendarTask | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [period, setPeriod] = useState<string>('morning');
  const [duration, setDuration] = useState('30');
  const [impact, setImpact] = useState<string>('medium');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['calendar', selectedDate],
    queryFn: () => calendarApi.getCalendar(token, selectedDate),
    enabled: Boolean(token),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['calendar'] });

  const createMutation = useMutation({
    mutationFn: () => calendarApi.createTask(token, {
      title, description: description || undefined, scheduledDate: selectedDate,
      period, durationMinutes: parseInt(duration) || 30, impact,
    }),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: () => Alert.alert('Error', 'Could not create task.'),
  });

  const updateMutation = useMutation({
    mutationFn: () => calendarApi.updateTask(token, editingTask!.id, {
      title, description: description || undefined, scheduledDate: selectedDate,
      period, durationMinutes: parseInt(duration) || 30, impact,
    }),
    onSuccess: () => { invalidate(); closeModal(); },
    onError: () => Alert.alert('Error', 'Could not update task.'),
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      calendarApi.markTaskComplete(token, id, completed),
    onSuccess: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => calendarApi.deleteTask(token, id),
    onSuccess: () => invalidate(),
    onError: () => Alert.alert('Error', 'Could not delete task.'),
  });

  const openAdd = () => {
    setEditingTask(null);
    setTitle(''); setDescription(''); setPeriod('morning'); setDuration('30'); setImpact('medium');
    setShowModal(true);
  };

  const openEdit = (t: CalendarTask) => {
    setEditingTask(t);
    setTitle(t.title); setDescription(t.description ?? ''); setPeriod(t.period); setDuration(String(t.durationMinutes)); setImpact(t.impact);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingTask(null); };

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Delete task', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(id) },
    ]);
  };

  const dayTasks = data?.dayPlan ?? [];
  const markedDates = data?.markedDates ?? {};

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
          <Text variant="display">Calendar</Text>
          <Text variant="body" tone="muted">Plan and track your farm activities</Text>
        </View>

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
              {selectedDate === today ? "Today's tasks" : `Tasks for ${selectedDate}`}
            </Text>
            <TouchableOpacity onPress={openAdd}>
              <Chip label="+ Add task" tone="success" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.primary} />
          ) : dayTasks.length === 0 ? (
            <Surface variant="muted" style={{ padding: 24, alignItems: 'center', gap: 8, borderRadius: 16 }}>
              <Ionicons name="calendar-outline" size={32} color={theme.colors.textSecondary} />
              <Text tone="muted">No tasks for this day.</Text>
              <Button label="Add a task" variant="outline" onPress={openAdd} />
            </Surface>
          ) : (
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
                  <Chip label={task.period} tone="info" />
                  <Chip label={`${task.durationMinutes} min`} tone="default" />
                  <Chip
                    label={task.impact}
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
                    {task.completed ? 'Completed' : 'Mark complete'}
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
        <ModalOverlay>
          <ModalContent>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ gap: 16 }}>
                <Text variant="headline">{editingTask ? 'Edit task' : 'New task'}</Text>
                <InputField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Inspect maize field" />
                <InputField
                  label="Description (optional)"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Add details..."
                  multiline
                  numberOfLines={2}
                />
                <Text variant="caption" tone="muted">Date: {selectedDate}</Text>
                <Text variant="caption" tone="muted">Time of day</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {periods.map((p) => (
                    <Chip key={p} label={p} tone={period === p ? 'success' : 'default'} onPress={() => setPeriod(p)} />
                  ))}
                </View>
                <InputField label="Duration (minutes)" value={duration} onChangeText={setDuration} keyboardType="number-pad" />
                <Text variant="caption" tone="muted">Priority</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {impacts.map((i) => (
                    <Chip key={i} label={i} tone={impact === i ? 'success' : 'default'} onPress={() => setImpact(i)} />
                  ))}
                </View>
                <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                  <Button label="Cancel" variant="outline" onPress={closeModal} style={{ flex: 1 }} />
                  <Button
                    label={editingTask ? 'Update' : 'Add task'}
                    onPress={() => editingTask ? updateMutation.mutate() : createMutation.mutate()}
                    loading={createMutation.isPending || updateMutation.isPending}
                    disabled={!title}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            </ScrollView>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </Screen>
  );
}
