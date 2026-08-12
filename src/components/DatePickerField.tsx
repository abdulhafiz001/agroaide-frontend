import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import React, { useMemo, useState } from 'react';
import { Modal, Platform, Pressable, TextInput, View } from 'react-native';
import styled, { useTheme } from '@/design-system/styled';

import { Button, Text } from '@/design-system/components';

type Props = {
  label: string;
  value: string;
  onChange: (isoDate: string) => void;
  maximumDate?: Date;
  minimumDate?: Date;
  error?: string;
};

const Wrapper = styled.View`
  width: 100%;
  gap: ${({ theme }) => theme.spacing.xs}px;
`;

const FieldRow = styled.View<{ hasError?: boolean }>`
  min-height: 48px;
  width: 100%;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.md}px;
  border-width: 1.5px;
  border-color: ${({ theme, hasError }) => (hasError ? theme.colors.danger : `${theme.colors.border}aa`)};
  background-color: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => `${theme.spacing.sm}px ${theme.spacing.md}px`};
`;

function parseIsoDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return new Date();
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDisplay(iso: string): string {
  const date = parseIsoDate(iso);
  try {
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function DatePickerField({ label, value, onChange, maximumDate, minimumDate, error }: Props) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseIsoDate(value || toIsoDate(new Date())), [value]);

  const onPick = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setOpen(false);
    }
    if (event.type === 'dismissed') {
      setOpen(false);
      return;
    }
    if (date) {
      onChange(toIsoDate(date));
    }
  };

  if (Platform.OS === 'web') {
    return (
      <Wrapper>
        <Text variant="caption" tone="muted">
          {label}
        </Text>
        <FieldRow hasError={Boolean(error)}>
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder="YYYY-MM-DD"
            // @ts-expect-error web-only date input
            type="date"
            style={{ flex: 1, color: theme.colors.textPrimary, outlineStyle: 'none' as any }}
            accessibilityLabel={label}
          />
        </FieldRow>
        {error ? (
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        ) : null}
      </Wrapper>
    );
  }

  return (
    <Wrapper>
      <Text variant="caption" tone="muted">
        {label}
      </Text>
      <Pressable onPress={() => setOpen(true)} accessibilityRole="button" accessibilityLabel={label}>
        <FieldRow hasError={Boolean(error)}>
          <Text variant="body">{value ? formatDisplay(value) : 'Select date'}</Text>
        </FieldRow>
      </Pressable>
      {error ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : null}

      {open && Platform.OS === 'android' ? (
        <DateTimePicker
          value={selected}
          mode="date"
          display="default"
          onChange={onPick}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' }} onPress={() => setOpen(false)} />
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 16,
              gap: 12,
            }}>
            <Text variant="headline">Select date</Text>
            <DateTimePicker
              value={selected}
              mode="date"
              display="spinner"
              onChange={onPick}
              maximumDate={maximumDate}
              minimumDate={minimumDate}
              style={{ alignSelf: 'center' }}
            />
            <Button label="Done" onPress={() => setOpen(false)} fullWidth />
          </View>
        </Modal>
      ) : null}
    </Wrapper>
  );
}
