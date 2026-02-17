import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import MapView, { Polygon } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { farmApi, type FarmField, type JournalEntry } from '@/services/farmApi';
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

const FieldCard = styled(Surface)`
  gap: 8px;
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
  max-height: 80%;
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

export default function FarmScreen() {
  const theme = useTheme();
  const token = useAppStore((s) => s.accessToken) ?? '';
  const queryClient = useQueryClient();

  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [editingField, setEditingField] = useState<FarmField | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const [fieldName, setFieldName] = useState('');
  const [fieldCrop, setFieldCrop] = useState('');
  const [fieldArea, setFieldArea] = useState('');
  const [journalNote, setJournalNote] = useState('');
  const [journalType, setJournalType] = useState('observation');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['farmOverview'],
    queryFn: () => farmApi.getOverview(token),
    enabled: Boolean(token),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['farmOverview'] });

  const addFieldMutation = useMutation({
    mutationFn: () => farmApi.addField(token, { name: fieldName, crop: fieldCrop, areaHectares: parseFloat(fieldArea) || 0 }),
    onSuccess: () => { invalidate(); closeFieldModal(); },
    onError: () => Alert.alert('Error', 'Could not add field.'),
  });

  const updateFieldMutation = useMutation({
    mutationFn: () => farmApi.updateField(token, editingField!.id, { name: fieldName, crop: fieldCrop, areaHectares: parseFloat(fieldArea) || 0 }),
    onSuccess: () => { invalidate(); closeFieldModal(); },
    onError: () => Alert.alert('Error', 'Could not update field.'),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (id: string) => farmApi.deleteField(token, id),
    onSuccess: () => invalidate(),
    onError: () => Alert.alert('Error', 'Could not delete field.'),
  });

  const addJournalMutation = useMutation({
    mutationFn: () => farmApi.addJournalEntry(token, { note: journalNote, type: journalType }),
    onSuccess: () => { invalidate(); closeJournalModal(); },
    onError: () => Alert.alert('Error', 'Could not add journal entry.'),
  });

  const updateJournalMutation = useMutation({
    mutationFn: () => farmApi.updateJournalEntry(token, editingEntry!.id, { note: journalNote, type: journalType }),
    onSuccess: () => { invalidate(); closeJournalModal(); },
    onError: () => Alert.alert('Error', 'Could not update entry.'),
  });

  const deleteJournalMutation = useMutation({
    mutationFn: (id: string) => farmApi.deleteJournalEntry(token, id),
    onSuccess: () => invalidate(),
    onError: () => Alert.alert('Error', 'Could not delete entry.'),
  });

  const openAddField = () => {
    setEditingField(null);
    setFieldName(''); setFieldCrop(''); setFieldArea('');
    setShowFieldModal(true);
  };

  const openEditField = (f: FarmField) => {
    setEditingField(f);
    setFieldName(f.name); setFieldCrop(f.crop); setFieldArea(String(f.area || ''));
    setShowFieldModal(true);
  };

  const closeFieldModal = () => { setShowFieldModal(false); setEditingField(null); };

  const openAddJournal = () => {
    setEditingEntry(null);
    setJournalNote(''); setJournalType('observation');
    setShowJournalModal(true);
  };

  const openEditJournal = (e: JournalEntry) => {
    setEditingEntry(e);
    setJournalNote(e.note); setJournalType(e.type);
    setShowJournalModal(true);
  };

  const closeJournalModal = () => { setShowJournalModal(false); setEditingEntry(null); };

  const confirmDelete = (type: 'field' | 'journal', id: string, name: string) => {
    Alert.alert('Delete', `Are you sure you want to delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        if (type === 'field') deleteFieldMutation.mutate(id);
        else deleteJournalMutation.mutate(id);
      }},
    ]);
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text tone="muted" style={{ marginTop: 12 }}>Loading farm data...</Text>
        </View>
      </Screen>
    );
  }

  const fields = data?.fields ?? [];
  const journal = data?.journal ?? [];
  const mapData = data?.map;
  const summary = data?.farmSummary;

  return (
    <Screen>
      <Container>
        <View style={{ paddingTop: 16, gap: 4 }}>
          <Text variant="display">{summary?.farmName || 'My Farm'}</Text>
          <Text variant="body" tone="muted">{summary?.farmLocation} - {summary?.farmSizeHectares} ha</Text>
        </View>

        {mapData && (
          <Section>
            <View style={{ height: 180, borderRadius: 16, overflow: 'hidden' }}>
              <MapView
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: mapData.center.latitude,
                  longitude: mapData.center.longitude,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
              >
                {mapData.polygon.length > 0 && (
                  <Polygon
                    coordinates={mapData.polygon}
                    fillColor="rgba(87, 179, 70, 0.2)"
                    strokeColor="#57b346"
                    strokeWidth={2}
                  />
                )}
              </MapView>
            </View>
          </Section>
        )}

        <Section>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headline">Farm fields ({fields.length})</Text>
            <Chip label="+ Add field" tone="success" onPress={openAddField} />
          </View>
          {fields.length === 0 ? (
            <Surface variant="muted" style={{ padding: 24, alignItems: 'center', gap: 8, borderRadius: 16 }}>
              <Ionicons name="leaf-outline" size={32} color={theme.colors.textSecondary} />
              <Text tone="muted">No fields yet. Add your first field to get started.</Text>
            </Surface>
          ) : (
            fields.map((field) => (
              <FieldCard key={field.id} rounded="xl">
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text variant="headline">{field.name}</Text>
                    <Text variant="caption" tone="muted">{field.crop} - {field.area} ha</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => openEditField(field)}>
                      <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete('field', field.id, field.name)}>
                      <Ionicons name="trash-outline" size={20} color="#e63946" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Chip label={`Health: ${field.health}%`} tone={field.health >= 70 ? 'success' : 'warning'} />
                  <Chip label={`Moisture: ${field.moisture}%`} tone="info" />
                  {field.daysSincePlanting != null && (
                    <Chip label={`Day ${field.daysSincePlanting}`} tone="default" />
                  )}
                  <Chip label={field.status} tone={field.status === 'active' ? 'success' : 'default'} />
                </View>
              </FieldCard>
            ))
          )}
        </Section>

        <Section>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headline">Field journal ({journal.length})</Text>
            <Chip label="+ Add note" tone="info" onPress={openAddJournal} />
          </View>
          {journal.length === 0 ? (
            <Surface variant="muted" style={{ padding: 24, alignItems: 'center', gap: 8, borderRadius: 16 }}>
              <Ionicons name="document-text-outline" size={32} color={theme.colors.textSecondary} />
              <Text tone="muted">No journal entries yet.</Text>
            </Surface>
          ) : (
            journal.map((entry) => (
              <Surface key={entry.id} rounded="lg" style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip label={entry.type} tone={entry.type === 'action' ? 'success' : 'info'} />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => openEditJournal(entry)}>
                      <Ionicons name="create-outline" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete('journal', entry.id, entry.note.substring(0, 20))}>
                      <Ionicons name="trash-outline" size={18} color="#e63946" />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text variant="body">{entry.note}</Text>
                {entry.fieldName && <Text variant="caption" tone="muted">Field: {entry.fieldName}</Text>}
                <Text variant="caption" tone="muted">{new Date(entry.date).toLocaleDateString()}</Text>
              </Surface>
            ))
          )}
        </Section>
      </Container>

      <FAB onPress={openAddField}>
        <Ionicons name="add" size={28} color="#fff" />
      </FAB>

      {/* Add/Edit Field Modal */}
      <Modal visible={showFieldModal} transparent animationType="slide" onRequestClose={closeFieldModal}>
        <ModalOverlay>
          <ModalContent>
            <Text variant="headline">{editingField ? 'Edit field' : 'Add new field'}</Text>
            <InputField label="Field name" value={fieldName} onChangeText={setFieldName} placeholder="e.g. North Block" />
            <InputField label="Crop" value={fieldCrop} onChangeText={setFieldCrop} placeholder="e.g. Maize" />
            <InputField label="Area (hectares)" value={fieldArea} onChangeText={setFieldArea} keyboardType="decimal-pad" />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button label="Cancel" variant="outline" onPress={closeFieldModal} style={{ flex: 1 }} />
              <Button
                label={editingField ? 'Update' : 'Add field'}
                onPress={() => editingField ? updateFieldMutation.mutate() : addFieldMutation.mutate()}
                loading={addFieldMutation.isPending || updateFieldMutation.isPending}
                disabled={!fieldName || !fieldCrop}
                style={{ flex: 1 }}
              />
            </View>
          </ModalContent>
        </ModalOverlay>
      </Modal>

      {/* Add/Edit Journal Modal */}
      <Modal visible={showJournalModal} transparent animationType="slide" onRequestClose={closeJournalModal}>
        <ModalOverlay>
          <ModalContent>
            <Text variant="headline">{editingEntry ? 'Edit journal entry' : 'Add journal entry'}</Text>
            <InputField
              label="Note"
              value={journalNote}
              onChangeText={setJournalNote}
              placeholder="What did you observe or do?"
              multiline
              numberOfLines={3}
            />
            <Text variant="caption" tone="muted">Type</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {['observation', 'action', 'issue', 'harvest'].map((t) => (
                <Chip key={t} label={t} tone={journalType === t ? 'success' : 'default'} onPress={() => setJournalType(t)} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button label="Cancel" variant="outline" onPress={closeJournalModal} style={{ flex: 1 }} />
              <Button
                label={editingEntry ? 'Update' : 'Add entry'}
                onPress={() => editingEntry ? updateJournalMutation.mutate() : addJournalMutation.mutate()}
                loading={addJournalMutation.isPending || updateJournalMutation.isPending}
                disabled={!journalNote}
                style={{ flex: 1 }}
              />
            </View>
          </ModalContent>
        </ModalOverlay>
      </Modal>
    </Screen>
  );
}
