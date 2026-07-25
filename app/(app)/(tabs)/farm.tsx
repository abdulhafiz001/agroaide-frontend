import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { FarmMapView, type FarmMapViewHandle } from '@/components/FarmMapView';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { useTranslation } from '@/i18n/useTranslation';
import { farmApi, type FarmField, type JournalEntry } from '@/services/farmApi';
import { useAppStore } from '@/store/useAppStore';
import { formatAreaWithFt, formatNaira } from '@/utils/formatters';

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

const FABContainer = styled.View`
  position: absolute;
  bottom: 90px;
  right: 20px;
  gap: 12px;
  align-items: center;
`;

const FAB = styled(TouchableOpacity)`
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

const ScanFAB = styled(TouchableOpacity)`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.accent};
  elevation: 4;
  shadow-color: #000;
  shadow-offset: 0px 2px;
  shadow-opacity: 0.25;
  shadow-radius: 4px;
`;

export default function FarmScreen() {
  const theme = useTheme();
  const toast = useToast();
  const { t } = useTranslation();
  const router = useRouter();
  const token = useAppStore((s) => s.accessToken) ?? '';
  const profile = useAppStore((s) => s.farmerProfile);
  const queryClient = useQueryClient();
  const mapRef = useRef<FarmMapViewHandle>(null);

  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [editingField, setEditingField] = useState<FarmField | null>(null);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);

  const [fieldName, setFieldName] = useState('');
  const [fieldCrop, setFieldCrop] = useState('');
  const [fieldArea, setFieldArea] = useState('');
  const [walkAfterSave, setWalkAfterSave] = useState(true);
  const [journalNote, setJournalNote] = useState('');
  const [journalType, setJournalType] = useState('observation');
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'field' | 'journal'; id: string; name: string } | null>(null);

  const profileCrops = profile?.crops?.filter(Boolean) ?? [];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['farmOverview'],
    queryFn: () => farmApi.getOverview(token),
    enabled: Boolean(token),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['farmOverview'] });

  const addFieldMutation = useMutation({
    mutationFn: () => farmApi.addField(token, { name: fieldName, crop: fieldCrop, areaM2: parseFloat(fieldArea) || 0 }),
    onSuccess: (res) => {
      invalidate();
      closeFieldModal();
      toast.success(t('fieldAdded'), walkAfterSave ? t('walkBoundaryWhenAtFarm') : t('skipWalkForNow'));
      if (walkAfterSave && res.field?.id) {
        router.push({
          pathname: '/walk-boundary',
          params: { fieldId: res.field.id, fieldName: res.field.name },
        });
      }
    },
    onError: () => toast.error(t('errorGeneric'), t('couldNotAddField')),
  });

  const updateFieldMutation = useMutation({
    mutationFn: () => farmApi.updateField(token, editingField!.id, { name: fieldName, crop: fieldCrop, areaM2: parseFloat(fieldArea) || 0 }),
    onSuccess: () => { invalidate(); closeFieldModal(); },
    onError: () => toast.error('Error', 'Could not update field.'),
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (id: string) => farmApi.deleteField(token, id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success('Deleted', 'Farm field removed.');
    },
    onError: () => toast.error('Error', 'Could not delete field.'),
  });

  const addJournalMutation = useMutation({
    mutationFn: () => farmApi.addJournalEntry(token, { note: journalNote, type: journalType }),
    onSuccess: () => { invalidate(); closeJournalModal(); },
    onError: () => toast.error('Error', 'Could not add journal entry.'),
  });

  const updateJournalMutation = useMutation({
    mutationFn: () => farmApi.updateJournalEntry(token, editingEntry!.id, { note: journalNote, type: journalType }),
    onSuccess: () => { invalidate(); closeJournalModal(); },
    onError: () => toast.error('Error', 'Could not update entry.'),
  });

  const deleteJournalMutation = useMutation({
    mutationFn: (id: string) => farmApi.deleteJournalEntry(token, id),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success('Deleted', 'Journal entry removed.');
    },
    onError: () => toast.error('Error', 'Could not delete entry.'),
  });

  const openAddField = () => {
    setEditingField(null);
    setFieldName('');
    setFieldCrop(profileCrops[0] ?? '');
    setFieldArea('');
    setWalkAfterSave(true);
    setShowFieldModal(true);
  };

  const openEditField = (f: FarmField) => {
    setEditingField(f);
    setFieldName(f.name);
    setFieldCrop(f.crop);
    setFieldArea(String(f.area || ''));
    setWalkAfterSave(false);
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
    setDeleteTarget({ type, id, name });
  };

  if (isLoading) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text tone="muted" style={{ marginTop: 12 }}>{t('loadingFarmData')}</Text>
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
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={!mapData?.center}
            onPress={() => mapRef.current?.zoomToFarm()}
            hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
          >
            <Text variant="display">{summary?.farmName || t('myFarm')}</Text>
          </TouchableOpacity>
          <Text variant="body" tone="muted">
            {summary?.farmLocation} · {formatAreaWithFt(summary?.farmSizeM2)}
          </Text>
        </View>

        {mapData && (
          <Section>
            <View style={{ height: 220, borderRadius: 16, overflow: 'hidden' }}>
              <FarmMapView
                ref={mapRef}
                center={mapData.center}
                polygon={mapData.polygon}
                farmName={summary?.farmName}
                fields={(mapData.fields ?? []).map((f) => ({
                  fieldId: f.fieldId,
                  name: f.name,
                  crop: f.crop,
                  polygon: f.polygon,
                }))}
              />
            </View>
            {(mapData.fields?.length ?? 0) > 0 ? (
              <Text variant="caption" tone="muted">
                Crop fields with walked boundaries are labeled on the map inside your farm.
              </Text>
            ) : (
              <Text variant="caption" tone="muted">
                Walk a field boundary to plot it accurately on this map.
              </Text>
            )}
          </Section>
        )}

        <Section>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headline">{t('farmFields')} ({fields.length})</Text>
            <Chip label={`+ ${t('addField')}`} tone="success" onPress={openAddField} />
          </View>
          {fields.length === 0 ? (
            <Surface variant="muted" style={{ padding: 24, alignItems: 'center', gap: 8, borderRadius: 16 }}>
              <Ionicons name="leaf-outline" size={32} color={theme.colors.textSecondary} />
              <Text tone="muted">{t('noFieldsYet')}</Text>
            </Surface>
          ) : (
            fields.map((field) => (
              <FieldCard key={field.id} rounded="xl">
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={0.7}
                    onPress={() =>
                      router.push({
                        pathname: '/field-detail',
                        params: { fieldId: field.id, fieldName: field.name },
                      })
                    }
                  >
                    <Text variant="headline">{field.name}</Text>
                    <Text variant="caption" tone="muted">
                      {field.crop} · {formatAreaWithFt(field.area)}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() =>
                        router.push({
                          pathname: '/field-detail',
                          params: { fieldId: field.id, fieldName: field.name },
                        })
                      }
                      style={{ backgroundColor: `${theme.colors.primary}18`, borderRadius: 14, padding: 4 }}
                    >
                      <Ionicons name="eye-outline" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/farm-scan', params: { fieldId: field.id, fieldName: field.name, fieldCrop: field.crop } })}
                      style={{ backgroundColor: `${theme.colors.accent}20`, borderRadius: 14, padding: 4 }}
                    >
                      <Ionicons name="scan" size={20} color={theme.colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openEditField(field)}>
                      <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmDelete('field', field.id, field.name)}>
                      <Ionicons name="trash-outline" size={20} color="#e63946" />
                    </TouchableOpacity>
                  </View>
                </View>
                {(field.totalExpense != null || field.totalIncome != null) && (
                  <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
                    <Text variant="caption" tone="muted">
                      Expenses {formatNaira(field.totalExpense ?? 0)}
                    </Text>
                    <Text variant="caption" tone="muted">
                      Income {formatNaira(field.totalIncome ?? 0)}
                    </Text>
                    <Text variant="caption">
                      Net {formatNaira(field.netProfit ?? 0)}
                    </Text>
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <Chip
                    label={t('details')}
                    tone="info"
                    onPress={() =>
                      router.push({
                        pathname: '/field-detail',
                        params: { fieldId: field.id, fieldName: field.name },
                      })
                    }
                  />
                  <Chip
                    label={t('walkBoundary')}
                    tone="info"
                    onPress={() =>
                      router.push({
                        pathname: '/walk-boundary',
                        params: { fieldId: field.id, fieldName: field.name },
                      })
                    }
                  />
                  <Chip
                    label={t('finances')}
                    tone="success"
                    onPress={() =>
                      router.push({
                        pathname: '/field-finances',
                        params: { fieldId: field.id, fieldName: field.name },
                      })
                    }
                  />
                  {field.hasMeasuredBoundary ? <Chip label={t('measured')} tone="success" /> : (
                    <Chip label={t('boundaryPending')} tone="warning" />
                  )}
                  <Chip label={`${t('healthLabel')}: ${field.health}%`} tone={field.health >= 70 ? 'success' : 'warning'} />
                  <Chip label={`${t('moistureLabel')}: ${field.moisture}%`} tone="info" />
                  {field.daysSincePlanting != null && (
                    <Chip label={`${t('dayLabel')} ${field.daysSincePlanting}`} tone="default" />
                  )}
                  <Chip label={field.status} tone={field.status === 'active' ? 'success' : 'default'} />
                </View>
              </FieldCard>
            ))
          )}
        </Section>

        <Section>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="headline">{t('fieldJournal')} ({journal.length})</Text>
            <Chip label={`+ ${t('addNote')}`} tone="info" onPress={openAddJournal} />
          </View>
          {journal.length === 0 ? (
            <Surface variant="muted" style={{ padding: 24, alignItems: 'center', gap: 8, borderRadius: 16 }}>
              <Ionicons name="document-text-outline" size={32} color={theme.colors.textSecondary} />
              <Text tone="muted">{t('noJournalEntries')}</Text>
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
                {entry.fieldName && <Text variant="caption" tone="muted">{t('fieldLabel')}: {entry.fieldName}</Text>}
                <Text variant="caption" tone="muted">{new Date(entry.date).toLocaleDateString()}</Text>
              </Surface>
            ))
          )}
        </Section>
      </Container>

      <FABContainer>
        <ScanFAB onPress={() => router.push('/farm-scan')}>
          <Ionicons name="scan" size={26} color="#fff" />
        </ScanFAB>
        <FAB onPress={openAddField}>
          <Ionicons name="add" size={28} color="#fff" />
        </FAB>
      </FABContainer>

      {/* Add/Edit Field Modal */}
      <Modal visible={showFieldModal} transparent animationType="slide" onRequestClose={closeFieldModal}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ModalOverlay>
            <ModalContent>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={{ gap: 16 }}>
                  <Text variant="headline">{editingField ? t('editField') : t('addNewField')}</Text>
                  <InputField label={t('fieldName')} value={fieldName} onChangeText={setFieldName} placeholder="e.g. North Block" />
                  <Text variant="caption" tone="muted">{t('cropPlantedOnField')}</Text>
                  {profileCrops.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {profileCrops.map((crop) => (
                        <Chip
                          key={crop}
                          label={crop}
                          tone={fieldCrop === crop ? 'success' : 'default'}
                          onPress={() => setFieldCrop(crop)}
                        />
                      ))}
                    </View>
                  ) : (
                    <InputField
                      label={t('cropLabel')}
                      value={fieldCrop}
                      onChangeText={setFieldCrop}
                      placeholder={t('addCropsInSettingsFirst')}
                    />
                  )}
                  <InputField
                    label={t('areaEstimateOptional')}
                    value={fieldArea}
                    onChangeText={setFieldArea}
                    keyboardType="decimal-pad"
                    placeholder={t('leaveBlankWalkBoundary')}
                  />
                  {fieldArea ? (
                    <Text variant="caption" tone="muted">{formatAreaWithFt(parseFloat(fieldArea) || 0)} — {t('estimatedUntilMeasured')}</Text>
                  ) : null}
                  {!editingField ? (
                    <View style={{ gap: 8 }}>
                      <Text variant="caption" tone="muted">
                        Accurate size comes from walking the field perimeter. You can do it now or later — we will remind you after 24 hours.
                      </Text>
                      <Chip
                        label={walkAfterSave ? `✓ ${t('walkBoundaryAfterSave')}` : t('skipWalkForNow')}
                        tone={walkAfterSave ? 'info' : 'default'}
                        onPress={() => setWalkAfterSave((v) => !v)}
                      />
                    </View>
                  ) : null}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Button label={t('cancel')} variant="ghost" onPress={closeFieldModal} style={{ flex: 1 }} />
                    <Button
                      label={editingField ? t('update') : t('addField')}
                      onPress={() => (editingField ? updateFieldMutation.mutate() : addFieldMutation.mutate())}
                      loading={addFieldMutation.isPending || updateFieldMutation.isPending}
                      disabled={!fieldName || !fieldCrop}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              </ScrollView>
            </ModalContent>
          </ModalOverlay>
        </KeyboardAvoidingView>
      </Modal>

      {/* Add/Edit Journal Modal */}
      <Modal visible={showJournalModal} transparent animationType="slide" onRequestClose={closeJournalModal}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ModalOverlay>
            <ModalContent>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={{ gap: 16 }}>
                  <Text variant="headline">{editingEntry ? t('editJournalEntry') : t('addJournalEntry')}</Text>
                  <InputField
                    label={t('noteLabel')}
                    value={journalNote}
                    onChangeText={setJournalNote}
                    placeholder={t('whatDidYouObserve')}
                    multiline
                    numberOfLines={3}
                  />
                  <Text variant="caption" tone="muted">{t('typeLabel')}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {['observation', 'action', 'issue', 'harvest'].map((type) => (
                      <Chip key={type} label={type} tone={journalType === type ? 'success' : 'default'} onPress={() => setJournalType(type)} />
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Button label={t('cancel')} variant="ghost" onPress={closeJournalModal} style={{ flex: 1 }} />
                    <Button
                      label={editingEntry ? t('update') : t('addJournalEntry')}
                      onPress={() => (editingEntry ? updateJournalMutation.mutate() : addJournalMutation.mutate())}
                      loading={addJournalMutation.isPending || updateJournalMutation.isPending}
                      disabled={!journalNote}
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
        title={deleteTarget?.type === 'field' ? 'Delete field?' : 'Delete journal entry?'}
        message={`Are you sure you want to delete "${deleteTarget?.name ?? ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        loading={deleteFieldMutation.isPending || deleteJournalMutation.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return;
          if (deleteTarget.type === 'field') deleteFieldMutation.mutate(deleteTarget.id);
          else deleteJournalMutation.mutate(deleteTarget.id);
        }}
      />
    </Screen>
  );
}
