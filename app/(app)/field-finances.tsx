import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as FileSystem from 'expo-file-system';
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
import { formatAreaM2, formatNaira } from '@/utils/formatters';
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

const categories: FieldTransaction['category'][] = ['SEED', 'FERTILIZER', 'LABOR', 'HARVEST_SALE', 'OTHER'];

export default function FieldFinancesScreen() {
  const theme = useTheme();
  const toast = useToast();
  const router = useRouter();
  const token = useAppStore((s) => s.accessToken) ?? '';
  const queryClient = useQueryClient();
  const { fieldId, fieldName } = useLocalSearchParams<{ fieldId: string; fieldName?: string }>();

  const [showModal, setShowModal] = useState(false);
  const [type, setType] = useState<FieldTransaction['type']>('EXPENSE');
  const [category, setCategory] = useState<FieldTransaction['category']>('SEED');
  const [amount, setAmount] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
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
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const clientUuid = createClientUuid();
      const payload = {
        type,
        category,
        amount: parseFloat(amount) || 0,
        quantity: quantity ? parseFloat(quantity) : undefined,
        unit: unit || undefined,
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
      setAmount('');
      setQuantity('');
      setNote('');
      toast.success('Saved', 'Transaction added.');
    },
    onError: () => {
      invalidate();
      setShowModal(false);
      toast.info('Queued offline', 'Transaction will sync when you reconnect.');
    },
  });

  const exportMutation = useMutation({
    mutationFn: (format: 'csv' | 'pdf') => farmApi.exportEconomics(token, String(fieldId), format),
    onSuccess: async (res) => {
      try {
        const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
        if (!baseDir) throw new Error('No writable directory');
        const path = `${baseDir}${res.filename}`;
        if (res.mimeType.includes('pdf') && res.content) {
          await FileSystem.writeAsStringAsync(path, res.content, { encoding: 'base64' });
        } else {
          await FileSystem.writeAsStringAsync(path, res.content ?? '', { encoding: 'utf8' });
        }
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(path, { mimeType: res.mimeType, dialogTitle: res.filename });
        } else {
          toast.success('Exported', res.filename);
        }
      } catch {
        toast.error('Export failed', 'Could not share the file.');
      }
    },
    onError: () => toast.error('Export failed', 'Server could not generate the file.'),
  });

  const economics = economicsQuery.data;
  const transactions = txQuery.data?.transactions ?? [];

  const categoryOptions = useMemo(
    () => (type === 'INCOME' ? (['HARVEST_SALE', 'OTHER'] as const) : categories.filter((c) => c !== 'HARVEST_SALE')),
    [type],
  );

  return (
    <Screen edges={['top', 'bottom']}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text variant="headline">Field finances</Text>
          <Text variant="caption" tone="muted">
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
              Field area: {formatAreaM2(economics?.areaM2)}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                label="Export CSV"
                variant="secondary"
                onPress={() => exportMutation.mutate('csv')}
                loading={exportMutation.isPending}
              />
              <Button
                label="Export PDF"
                variant="ghost"
                onPress={() => exportMutation.mutate('pdf')}
                loading={exportMutation.isPending}
              />
            </View>
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
              <Text variant="body">{tx.category.replace('_', ' ')}</Text>
              <Text variant="caption" tone="muted">
                {tx.occurredOn}
                {tx.quantity != null ? ` · ${tx.quantity}${tx.unit ? ` ${tx.unit}` : ''}` : ''}
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
              <Text variant="headline">Add transaction</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['EXPENSE', 'INCOME'] as const).map((t) => (
                  <Chip key={t} label={t} tone={type === t ? 'success' : 'default'} onPress={() => setType(t)} />
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
              <InputField label="Amount (₦)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
              <InputField label="Date (YYYY-MM-DD)" value={occurredOn} onChangeText={setOccurredOn} />
              <InputField label="Quantity (optional)" value={quantity} onChangeText={setQuantity} keyboardType="decimal-pad" />
              <InputField label="Unit (kg, bags…)" value={unit} onChangeText={setUnit} />
              <InputField label="Note" value={note} onChangeText={setNote} />
              <Button
                label="Save"
                fullWidth
                onPress={() => createMutation.mutate()}
                loading={createMutation.isPending}
              />
              <Button label="Cancel" variant="ghost" fullWidth onPress={() => setShowModal(false)} />
            </ModalContent>
          </KeyboardAvoidingView>
        </ModalOverlay>
      </Modal>
    </Screen>
  );
}
