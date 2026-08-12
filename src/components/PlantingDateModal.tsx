import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import styled, { useTheme } from '@/design-system/styled';

import { DatePickerField } from '@/components/DatePickerField';
import { Button, Surface, Text } from '@/design-system/components';

export type PlantingPromptField = {
  id: string;
  name: string;
  crop: string;
};

type Props = {
  visible: boolean;
  fields: PlantingPromptField[];
  submitting?: boolean;
  onSubmit: (fieldId: string, plantedAt: string) => void;
  onDismiss: () => void;
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
  gap: 14px;
  max-height: 85%;
`;

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function PlantingDateModal({ visible, fields, submitting, onSubmit, onDismiss }: Props) {
  const theme = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(fields[0]?.id ?? null);
  const [plantedAt, setPlantedAt] = useState(todayIsoDate());

  const activeId = selectedId && fields.some((f) => f.id === selectedId) ? selectedId : fields[0]?.id;
  const active = fields.find((f) => f.id === activeId);

  if (!visible || fields.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ModalOverlay>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onDismiss} />
          <ModalContent>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={{ gap: 14 }}>
                <Text variant="headline">When did you plant?</Text>
                <Text variant="body" tone="muted">
                  Tell us the planting date for each crop so your AI advisor can estimate harvest windows and remind
                  you.
                </Text>

                <View style={{ gap: 8, maxHeight: 160 }}>
                  {fields.map((field) => {
                    const selected = field.id === activeId;
                    return (
                      <TouchableOpacity
                        key={field.id}
                        onPress={() => setSelectedId(field.id)}
                        style={{
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: selected ? theme.colors.primary : theme.colors.border,
                          backgroundColor: selected ? `${theme.colors.primary}14` : theme.colors.surface,
                        }}>
                        <Text variant="headline" style={{ fontSize: 16 }}>
                          {field.name}
                        </Text>
                        <Text variant="caption" tone="muted">
                          {field.crop}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <DatePickerField
                  label="Planting date"
                  value={plantedAt}
                  onChange={setPlantedAt}
                  maximumDate={new Date()}
                />

                <Button
                  label={active ? `Save date for ${active.name}` : 'Save planting date'}
                  loading={submitting}
                  disabled={!activeId || !/^\d{4}-\d{2}-\d{2}$/.test(plantedAt)}
                  onPress={() => activeId && onSubmit(activeId, plantedAt)}
                  fullWidth
                />
                <Button label="Ask me later today" variant="ghost" onPress={onDismiss} fullWidth />
                <View style={{ height: 8 }} />
              </View>
            </ScrollView>
          </ModalContent>
        </ModalOverlay>
      </KeyboardAvoidingView>
    </Modal>
  );
}
