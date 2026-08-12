import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
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
import styled, { useTheme } from '@/design-system/styled';

import { ConfirmModal } from '@/components/ConfirmModal';
import { OfflineBanner } from '@/components/OfflineBanner';
import { useToast } from '@/components/Toast';
import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

import { useTranslation } from '@/i18n/useTranslation';
import { farmApi, type FarmField, type FarmOverviewResponse, type JournalEntry } from '@/services/farmApi';
import { loadOfflineCache, saveOfflineCache } from '@/services/offlineCache';
import { isOfflineQueuedError, withOfflineQueue } from '@/services/offlineQueue';
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
  const { isOffline } = useNetworkStatus();
  const userKey = profile?.id ?? 'anon';
  const farmCacheKey = `farmOverview:${userKey}`;

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
  const [lastPulledAt, setLastPulledAt] = useState<string | null>(null);

  const profileCrops = profile?.crops?.filter(Boolean) ?? [];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = await loadOfflineCache<FarmOverviewResponse>(farmCacheKey);
      if (!cancelled && cached?.data) {
        queryClient.setQueryData(['farmOverview'], cached.data);
        setLastPulledAt(cached.savedAt);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [farmCacheKey, queryClient]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['farmOverview'],
    queryFn: async () => {
      const overview = await farmApi.getOverview(token);
      await saveOfflineCache(farmCacheKey, overview);
      setLastPulledAt(new Date().toISOString());
      return overview;
    },
    enabled: Boolean(token),
    retry: isOffline ? false : 1,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['farmOverview'] });

  const patchFarmCache = (updater: (prev: FarmOverviewResponse) => FarmOverviewResponse) => {
    queryClient.setQueryData<FarmOverviewResponse>(['farmOverview'], (prev) => {
      if (!prev) return prev;
      const next = updater(prev);
      void saveOfflineCache(farmCacheKey, next);
      return next;
    });
  };

  const addFieldMutation = useMutation({
    mutationFn: () =>
      withOfflineQueue({
        actionType: 'field.create',
        runOnline: (clientUuid) =>
          farmApi.addField(token, {
            name: fieldName,
            crop: fieldCrop,
            areaM2: parseFloat(fieldArea) || 0,
            clientUuid,
          }),
        buildPayload: () => ({
          name: fieldName,
          crop: fieldCrop,
          areaM2: parseFloat(fieldArea) || 0,
        }),
      }),
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
    onError: (err) => {
      if (isOfflineQueuedError(err)) {
        const tempId = `offline-field-${Date.now()}`;
        patchFarmCache((prev) => ({
          ...prev,
          fields: [
            {
              id: tempId,
              name: fieldName,
              crop: fieldCrop,
              area: parseFloat(fieldArea) || 0,
              health: 80,
              moisture: 50,
              daysSincePlanting: null,
              status: 'active',
              plantedAt: null,
              hasMeasuredBoundary: false,
            },
            ...prev.fields,
          ],
        }));
        closeFieldModal();
        toast.info('Added offline', 'Field saved on this device and will sync when you come back online.');
        return;
      }
      toast.error(t('errorGeneric'), t('couldNotAddField'));
    },
  });

  const updateFieldMutation = useMutation({
    mutationFn: () =>
      withOfflineQueue({
        actionType: 'field.update',
        runOnline: () =>
          farmApi.updateField(token, editingField!.id, {
            name: fieldName,
            crop: fieldCrop,
            areaM2: parseFloat(fieldArea) || 0,
          }),
        buildPayload: () => ({
          id: Number(editingField!.id),
          fieldId: Number(editingField!.id),
          name: fieldName,
          crop: fieldCrop,
          areaM2: parseFloat(fieldArea) || 0,
        }),
      }),
    onSuccess: () => {
      invalidate();
      closeFieldModal();
    },
    onError: (err) => {
      if (isOfflineQueuedError(err) && editingField) {
        patchFarmCache((prev) => ({
          ...prev,
          fields: prev.fields.map((f) =>
            f.id === editingField.id
              ? { ...f, name: fieldName, crop: fieldCrop, area: parseFloat(fieldArea) || 0 }
              : f,
          ),
        }));
        closeFieldModal();
        toast.info('Updated offline', 'Field changes will sync when you come back online.');
        return;
      }
      toast.error('Error', 'Could not update field.');
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: (id: string) =>
      withOfflineQueue({
        actionType: 'field.delete',
        runOnline: () => farmApi.deleteField(token, id),
        buildPayload: () => ({ id: Number(id), fieldId: Number(id) }),
      }),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success('Deleted', 'Farm field removed.');
    },
    onError: (err) => {
      if (isOfflineQueuedError(err) && deleteTarget) {
        patchFarmCache((prev) => ({
          ...prev,
          fields: prev.fields.filter((f) => f.id !== deleteTarget.id),
        }));
        setDeleteTarget(null);
        toast.info('Queued offline', 'Field delete will sync when you come back online.');
        return;
      }
      toast.error('Error', 'Could not delete field.');
    },
  });

  const addJournalMutation = useMutation({
    mutationFn: () =>
      withOfflineQueue({
        actionType: 'journal.create',
        runOnline: (clientUuid) =>
          farmApi.addJournalEntry(token, { note: journalNote, type: journalType, clientUuid }),
        buildPayload: () => ({ note: journalNote, type: journalType }),
      }),
    onSuccess: () => {
      invalidate();
      closeJournalModal();
    },
    onError: (err) => {
      if (isOfflineQueuedError(err)) {
        const tempId = `offline-journal-${Date.now()}`;
        patchFarmCache((prev) => ({
          ...prev,
          journal: [
            {
              id: tempId,
              date: new Date().toISOString(),
              note: journalNote,
              type: journalType,
            },
            ...prev.journal,
          ],
        }));
        closeJournalModal();
        toast.info('Added offline', 'Journal entry saved on this device and will sync when you come back online.');
        return;
      }
      toast.error('Error', 'Could not add journal entry.');
    },
  });

  const updateJournalMutation = useMutation({
    mutationFn: () =>
      withOfflineQueue({
        actionType: 'journal.update',
        runOnline: () => farmApi.updateJournalEntry(token, editingEntry!.id, { note: journalNote, type: journalType }),
        buildPayload: () => ({ id: editingEntry!.id, note: journalNote, type: journalType }),
      }),
    onSuccess: () => { invalidate(); closeJournalModal(); },
    onError: (error) => {
      if (isOfflineQueuedError(error) && editingEntry) {
        patchFarmCache((prev) => ({
          ...prev,
          journal: prev.journal.map((j) =>
            j.id === editingEntry.id ? { ...j, note: journalNote, type: journalType } : j,
          ),
        }));
        closeJournalModal();
        toast.info('Updated offline', 'Journal update will sync when you come back online.');
        return;
      }
      toast.error('Error', 'Could not update entry.');
    },
  });

  const deleteJournalMutation = useMutation({
    mutationFn: (id: string) =>
      withOfflineQueue({
        actionType: 'journal.delete',
        runOnline: () => farmApi.deleteJournalEntry(token, id),
        buildPayload: () => ({ id }),
      }),
    onSuccess: () => {
      invalidate();
      setDeleteTarget(null);
      toast.success('Deleted', 'Journal entry removed.');
    },
    onError: (error) => {
      if (isOfflineQueuedError(error)) {
        invalidate();
        setDeleteTarget(null);
        toast.info('Queued offline', 'Journal delete will sync when you reconnect.');
        return;
      }
      toast.error('Error', 'Could not delete entry.');
    },
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

  if (isLoading && !data) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text tone="muted" style={{ marginTop: 12 }}>{t('loadingFarmData')}</Text>
        </View>
      </Screen>
    );
  }

  if (isError && !data) {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
          <Text variant="headline">Could not load farm</Text>
          <Text tone="muted" align="center">
            {isOffline
              ? 'You are offline and no saved farm data is available yet. Connect once to load your fields.'
              : 'Unable to reach AgroAide right now. Please try again shortly.'}
          </Text>
          <Button label={t('retry')} onPress={() => invalidate()} fullWidth />
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
        <OfflineBanner visible={isOffline || (isError && Boolean(data))} lastPulledAt={lastPulledAt} label="farm information" />
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
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${field.name}`}
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
                      accessibilityRole="button"
                      accessibilityLabel={`View ${field.name}`}
                    >
                      <Ionicons name="eye-outline" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => router.push({ pathname: '/farm-scan', params: { fieldId: field.id, fieldName: field.name, fieldCrop: field.crop } })}
                      style={{ backgroundColor: `${theme.colors.accent}20`, borderRadius: 14, padding: 4 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Scan ${field.name}`}
                    >
                      <Ionicons name="scan" size={20} color={theme.colors.accent} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => openEditField(field)}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${field.name}`}>
                      <Ionicons name="create-outline" size={20} color={theme.colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDelete('field', field.id, field.name)}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${field.name}`}>
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
                    label="Seed & fertilizer"
                    tone="success"
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
        <ScanFAB
          onPress={() => router.push('/farm-scan')}
          accessibilityRole="button"
          accessibilityLabel="Scan crop health">
          <Ionicons name="scan" size={26} color="#fff" />
        </ScanFAB>
        <FAB onPress={openAddField} accessibilityRole="button" accessibilityLabel="Add farm field">
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
