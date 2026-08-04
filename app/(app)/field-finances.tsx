import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { useToast } from '@/components/Toast';
import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { farmApi, type FieldTransaction } from '@/services/farmApi';
import { enqueueSyncAction } from '@/services/syncQueue';
import { useAppStore } from '@/store/useAppStore';
import { formatAreaWithFt, formatNaira } from '@/utils/formatters';
import { createClientUuid } from '@/utils/geoArea';

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

const ModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: flex-end;
`;

const ModalContent = styled(Surface)`
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 24px;
  gap: 12px;
`;

const expenseCategories: FieldTransaction['category'][] = ['SEED', 'FERTILIZER', 'LABOR', 'OTHER'];
const incomeCategories: FieldTransaction['category'][] = ['HARVEST_SALE', 'OTHER'];

export default function FieldFinancesScreen() {
  const theme = useTheme();
  const toast = useToast();
  const router = useRouter();
  const token = useAppStore((s) => s.accessToken) ?? '';
  const queryClient = useQueryClient();
  const { fieldId, fieldName } = useLocalSearchParams<{ fieldId: string; fieldName?: string }>();

  const [showModal, setShowModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPath, setExportPath] = useState<string | null>(null);
  const [exportFilename, setExportFilename] = useState('');
  const [type, setType] = useState<FieldTransaction['type']>('EXPENSE');
  const [category, setCategory] = useState<FieldTransaction['category']>('SEED');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [saleItem, setSaleItem] = useState('');
  const [categoryOther, setCategoryOther] = useState('');
  const [note, setNote] = useState('');
  const [occurredOn, setOccurredOn] = useState(new Date().toISOString().slice(0, 10));

  const economicsQuery = useQuery({
    queryKey: ['fieldEconomics', fieldId],
    queryFn: () => farmApi.getFieldEconomics(token, String(fieldId)),
    enabled: Boolean(token && fieldId),
  });

  const txQuery = useQuery({
    queryKey: ['fieldTransactions', fieldId],
    queryFn: () => farmApi.listTransactions(token, String(fieldId)),
    enabled: Boolean(token && fieldId),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['fieldEconomics', fieldId] });
    queryClient.invalidateQueries({ queryKey: ['fieldTransactions', fieldId] });
    queryClient.invalidateQueries({ queryKey: ['farmOverview'] });
  };

  const resetForm = () => {
    setAmount('');
    setQuantity('');
    setSaleItem('');
    setCategoryOther('');
    setNote('');
    setType('EXPENSE');
    setCategory('SEED');
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const clientUuid = createClientUuid();
      const payload = {
        type,
        category,
        amount: parseFloat(amount) || 0,
        quantity: quantity ? parseFloat(quantity) : undefined,
        saleItem: type === 'INCOME' ? saleItem.trim() || undefined : undefined,
        categoryOther: category === 'OTHER' ? categoryOther.trim() || undefined : undefined,
        occurredOn,
        note: note || undefined,
        clientUuid,
      };
      try {
        return await farmApi.createTransaction(token, String(fieldId), payload);
      } catch (error: any) {
        await enqueueSyncAction({
          uuid: clientUuid,
          clientTimestamp: new Date().toISOString(),
          actionType: 'transaction.create',
          payload: { ...payload, farmFieldId: Number(fieldId) },
        });
        throw error;
      }
    },
    onSuccess: () => {
      invalidate();
      setShowModal(false);
      resetForm();
      toast.success('Saved', 'Transaction added.');
    },
    onError: () => {
      invalidate();
      setShowModal(false);
      toast.info('Queued offline', 'Transaction will sync when you reconnect.');
    },
  });

  const exportMutation = useMutation({
    mutationFn: () => farmApi.exportEconomics(token, String(fieldId)),
    onSuccess: async (res) => {
      try {
        const baseDir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
        if (!baseDir) throw new Error('No writable directory');
        const path = `${baseDir}${res.filename}`;

        // Prefer inline base64 (works offline from the export response). Fall back to signed URL.
        if (res.content) {
          const isBase64 =
            res.encoding === 'base64' ||
            res.mimeType.includes('pdf') ||
            Boolean(res.content && /^[A-Za-z0-9+/=\s]+$/.test(res.content.slice(0, 80)));
          await FileSystem.writeAsStringAsync(path, res.content, {
            encoding: isBase64 ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
          });
        } else if (res.downloadUrl) {
          const downloaded = await FileSystem.downloadAsync(res.downloadUrl, path);
          if (downloaded.status !== 200) {
            throw new Error(`Download failed (${downloaded.status})`);
          }
        } else {
          throw new Error('Export response had no file content');
        }

        setExportPath(path);
        setExportFilename(res.filename);
        setShowExportModal(true);
      } catch (e: any) {
        toast.error('Export failed', e?.message || 'Could not save the PDF.');
      }
    },
    onError: (err: any) =>
      toast.error('Export failed', err?.message || 'Server could not generate the file.'),
  });

  const shareExport = async () => {
    if (!exportPath) return;
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(exportPath, {
          mimeType: 'application/pdf',
          dialogTitle: exportFilename,
          UTI: 'com.adobe.pdf',
        });
      } else {
        toast.success('Saved', exportFilename);
      }
    } catch {
      toast.error('Share failed', 'Could not open the share sheet.');
    }
  };

  const economics = economicsQuery.data;
  const transactions = txQuery.data?.transactions ?? [];

  const categoryOptions = useMemo(
    () => (type === 'INCOME' ? incomeCategories : expenseCategories),
    [type],
  );

  const canSave =
    Boolean(amount) &&
    (category !== 'OTHER' || categoryOther.trim().length > 0) &&
    (type !== 'INCOME' || saleItem.trim().length > 0 || category === 'OTHER');

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.colors.primary }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text variant="headline" style={{ color: '#fff', fontWeight: '700' }}>
            Field finances
          </Text>
          <Text variant="caption" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {fieldName || `Field #${fieldId}`}
          </Text>
        </View>
        <Chip label="+ Add" tone="success" onPress={() => setShowModal(true)} />
      </View>

      <Container>
        {economicsQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 24 }} />
        ) : (
          <Surface rounded="xl" style={{ gap: 10, marginTop: 8 }}>
            <Text variant="eyebrow" tone="accent">
              Summary
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
              <View style={{ minWidth: '45%' }}>
                <Text variant="caption" tone="muted">
                  Expenses
                </Text>
                <Text variant="headline">{formatNaira(economics?.totals.expense)}</Text>
              </View>
              <View style={{ minWidth: '45%' }}>
                <Text variant="caption" tone="muted">
                  Income
                </Text>
                <Text variant="headline">{formatNaira(economics?.totals.income)}</Text>
              </View>
              <View style={{ minWidth: '45%' }}>
                <Text variant="caption" tone="muted">
                  Net profit
                </Text>
                <Text variant="headline">{formatNaira(economics?.totals.netProfit)}</Text>
              </View>
              <View style={{ minWidth: '45%' }}>
                <Text variant="caption" tone="muted">
                  Cost / m²
                </Text>
                <Text variant="headline">
                  {economics?.costPerM2 != null ? formatNaira(economics.costPerM2) : '—'}
                </Text>
              </View>
            </View>
            <Text variant="caption" tone="muted">
              Field area: {formatAreaWithFt(economics?.areaM2)}
            </Text>
            <Button
              label="Export PDF report"
              variant="secondary"
              onPress={() => exportMutation.mutate()}
              loading={exportMutation.isPending}
              fullWidth
            />
          </Surface>
        )}

        <Text variant="headline" style={{ marginTop: 20, marginBottom: 8 }}>
          Ledger
        </Text>
        {txQuery.isLoading ? (
          <ActivityIndicator color={theme.colors.primary} />
        ) : transactions.length === 0 ? (
          <Surface variant="muted" style={{ padding: 20, borderRadius: 16 }}>
            <Text tone="muted">No transactions yet. Log seed, fertilizer, labor, or harvest sales.</Text>
          </Surface>
        ) : (
          transactions.map((tx) => (
            <Surface key={tx.id} rounded="lg" style={{ gap: 6, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Chip label={tx.type} tone={tx.type === 'INCOME' ? 'success' : 'warning'} />
                <Text variant="headline">{formatNaira(tx.amount)}</Text>
              </View>
              <Text variant="body">
                {tx.category === 'OTHER' && tx.categoryOther
                  ? tx.categoryOther
                  : tx.category.replace('_', ' ')}
              </Text>
              {tx.saleItem ? (
                <Text variant="caption" tone="muted">
                  Sold: {tx.saleItem}
                </Text>
              ) : null}
              <Text variant="caption" tone="muted">
                {tx.occurredOn}
                {tx.quantity != null ? ` · qty ${tx.quantity}` : ''}
              </Text>
              {tx.note ? <Text variant="caption">{tx.note}</Text> : null}
            </Surface>
          ))
        )}
      </Container>

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <ModalOverlay>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ModalContent>
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={{ gap: 12 }}>
                  <Text variant="headline">Add transaction</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['EXPENSE', 'INCOME'] as const).map((t) => (
                      <Chip
                        key={t}
                        label={t}
                        tone={type === t ? 'success' : 'default'}
                        onPress={() => {
                          setType(t);
                          setCategory(t === 'INCOME' ? 'HARVEST_SALE' : 'SEED');
                          setSaleItem('');
                          setCategoryOther('');
                        }}
                      />
                    ))}
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {categoryOptions.map((c) => (
                      <Chip
                        key={c}
                        label={c.replace('_', ' ')}
                        tone={category === c ? 'info' : 'default'}
                        onPress={() => setCategory(c)}
                      />
                    ))}
                  </View>
                  {type === 'INCOME' ? (
                    <InputField
                      label="What did you sell?"
                      value={saleItem}
                      onChangeText={setSaleItem}
                      placeholder="e.g. Maize bags, tomatoes"
                    />
                  ) : null}
                  {category === 'OTHER' ? (
                    <InputField
                      label="Describe this item"
                      value={categoryOther}
                      onChangeText={setCategoryOther}
                      placeholder="e.g. Transport, pesticide, tools"
                    />
                  ) : null}
                  <InputField label="Amount (₦)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
                  <InputField label="Date (YYYY-MM-DD)" value={occurredOn} onChangeText={setOccurredOn} />
                  <InputField
                    label="Quantity (optional)"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="decimal-pad"
                    placeholder="No unit needed"
                  />
                  <InputField label="Note (optional)" value={note} onChangeText={setNote} />
                  <Button
                    label="Save"
                    fullWidth
                    onPress={() => createMutation.mutate()}
                    loading={createMutation.isPending}
                    disabled={!canSave}
                  />
                  <Button label="Cancel" variant="ghost" fullWidth onPress={() => setShowModal(false)} />
                </View>
              </ScrollView>
            </ModalContent>
          </KeyboardAvoidingView>
        </ModalOverlay>
      </Modal>

      <Modal visible={showExportModal} animationType="fade" transparent onRequestClose={() => setShowExportModal(false)}>
        <ModalOverlay style={{ justifyContent: 'center', padding: 24 }}>
          <Surface rounded="xl" style={{ gap: 14, padding: 20 }}>
            <Text variant="headline">PDF ready</Text>
            <Text variant="body" tone="muted">
              {exportFilename} is saved on this device. Share it, or keep the downloaded copy.
            </Text>
            <Button label="Share" onPress={shareExport} fullWidth />
            <Button
              label="Done — file downloaded"
              variant="secondary"
              onPress={() => {
                setShowExportModal(false);
                toast.success('Downloaded', exportFilename);
              }}
              fullWidth
            />
            <Button label="Close" variant="ghost" fullWidth onPress={() => setShowExportModal(false)} />
          </Surface>
        </ModalOverlay>
      </Modal>
    </Screen>
  );
}
