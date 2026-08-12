import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import styled, { useTheme } from '@/design-system/styled';

import { DatePickerField } from '@/components/DatePickerField';
import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';

type Step = 'harvest' | 'next' | 'rate' | 'done';

type Props = {
  visible: boolean;
  fieldName: string;
  crop: string;
  profileCrops: string[];
  mode?: 'harvest' | 'plan';
  submitting?: boolean;
  ratingSubmitting?: boolean;
  shouldPromptRating?: boolean;
  onHarvest: (payload: {
    harvestedAt: string;
    yieldNote?: string;
    plannedNextCrop?: string;
    plannedPlantAt?: string;
  }) => Promise<{ shouldPromptRating?: boolean } | void>;
  onPlanNextOnly?: (payload: { plannedNextCrop: string; plannedPlantAt: string }) => Promise<void>;
  onRate: (payload: { stars: number; comment?: string } | { dismissed: true }) => Promise<void>;
  onClose: () => void;
};

const Overlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.5);
  justify-content: flex-end;
`;

const Sheet = styled(Surface)`
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 24px;
  max-height: 90%;
  gap: 12px;
`;

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function HarvestCompleteModal({
  visible,
  fieldName,
  crop,
  profileCrops,
  mode = 'harvest',
  submitting,
  ratingSubmitting,
  shouldPromptRating = true,
  onHarvest,
  onPlanNextOnly,
  onRate,
  onClose,
}: Props) {
  const theme = useTheme();
  const [step, setStep] = useState<Step>(mode === 'plan' ? 'next' : 'harvest');
  const [harvestedAt, setHarvestedAt] = useState(todayIso());
  const [yieldNote, setYieldNote] = useState('');
  const [nextCrop, setNextCrop] = useState(profileCrops[0] ?? '');
  const [plantAt, setPlantAt] = useState(addDaysIso(14));
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [pendingPlan, setPendingPlan] = useState(false);

  const crops = useMemo(() => {
    const list = [...profileCrops];
    if (crop && !list.includes(crop)) list.unshift(crop);
    return list;
  }, [profileCrops, crop]);

  React.useEffect(() => {
    if (visible) {
      setStep(mode === 'plan' ? 'next' : 'harvest');
    }
  }, [visible, mode]);

  if (!visible) return null;

  const resetAndClose = () => {
    setStep(mode === 'plan' ? 'next' : 'harvest');
    setHarvestedAt(todayIso());
    setYieldNote('');
    setStars(0);
    setComment('');
    setPendingPlan(false);
    onClose();
  };

  const submitHarvest = async (includePlan: boolean) => {
    const res = await onHarvest({
      harvestedAt,
      yieldNote: yieldNote.trim() || undefined,
      ...(includePlan && nextCrop && plantAt
        ? { plannedNextCrop: nextCrop, plannedPlantAt: plantAt }
        : {}),
    });
    const prompt = res?.shouldPromptRating ?? shouldPromptRating;
    if (prompt) {
      setStep('rate');
    } else {
      setStep('done');
      resetAndClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetAndClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <Overlay>
          <Pressable style={{ flex: 1 }} onPress={resetAndClose} />
          <Sheet>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View style={{ gap: 14 }}>
                {step === 'harvest' ? (
                  <>
                    <Text variant="headline">Mark harvest complete</Text>
                    <Text variant="body" tone="muted">
                      {fieldName} · {crop}. Confirm the harvest date so your advisor knows this cycle succeeded.
                    </Text>
                    <DatePickerField
                      label="Harvest date"
                      value={harvestedAt}
                      onChange={setHarvestedAt}
                      maximumDate={new Date()}
                    />
                    <InputField
                      label="Yield note (optional)"
                      value={yieldNote}
                      onChangeText={setYieldNote}
                      placeholder="e.g. about 3 bags"
                    />
                    <Button
                      label="Continue"
                      loading={submitting}
                      disabled={!/^\d{4}-\d{2}-\d{2}$/.test(harvestedAt)}
                      onPress={() => setStep('next')}
                      fullWidth
                    />
                    <Button label="Cancel" variant="ghost" onPress={resetAndClose} fullWidth />
                  </>
                ) : null}

                {step === 'next' ? (
                  <>
                    <Text variant="headline">Plan next crop?</Text>
                    <Text variant="body" tone="muted">
                      Optional. Pick what you want to plant next and when — we will remind you 2 days before and on the day.
                    </Text>
                    <Text variant="caption" tone="muted">
                      Next crop
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {crops.map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          tone={nextCrop === c ? 'success' : 'default'}
                          onPress={() => setNextCrop(c)}
                        />
                      ))}
                    </View>
                    {!crops.length ? (
                      <InputField label="Crop name" value={nextCrop} onChangeText={setNextCrop} placeholder="e.g. maize" />
                    ) : null}
                    <DatePickerField
                      label="Target plant date"
                      value={plantAt}
                      onChange={setPlantAt}
                      minimumDate={new Date()}
                    />
                    <Button
                      label={mode === 'plan' ? 'Save next crop plan' : 'Save harvest + next crop'}
                      loading={submitting}
                      disabled={!nextCrop || !/^\d{4}-\d{2}-\d{2}$/.test(plantAt)}
                      onPress={() => {
                        setPendingPlan(true);
                        if (mode === 'plan' && onPlanNextOnly) {
                          void onPlanNextOnly({ plannedNextCrop: nextCrop, plannedPlantAt: plantAt }).then(() =>
                            resetAndClose(),
                          );
                          return;
                        }
                        void submitHarvest(true);
                      }}
                      fullWidth
                    />
                    {mode === 'harvest' ? (
                      <Button
                        label="Maybe later — just save harvest"
                        variant="secondary"
                        loading={submitting && !pendingPlan}
                        onPress={() => {
                          setPendingPlan(false);
                          void submitHarvest(false);
                        }}
                        fullWidth
                      />
                    ) : null}
                    {mode === 'harvest' ? (
                      <Button label="Back" variant="ghost" onPress={() => setStep('harvest')} fullWidth />
                    ) : (
                      <Button label="Cancel" variant="ghost" onPress={resetAndClose} fullWidth />
                    )}
                  </>
                ) : null}

                {step === 'rate' ? (
                  <>
                    <Text variant="headline">How is AgroAide helping?</Text>
                    <Text variant="body" tone="muted">
                      Quick rating stays private in our database for now — thank you.
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 10, paddingVertical: 8 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Pressable
                          key={n}
                          onPress={() => setStars(n)}
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: stars >= n ? theme.colors.primary : `${theme.colors.border}55`,
                          }}>
                          <Text variant="headline" style={{ color: stars >= n ? '#fff' : theme.colors.textPrimary }}>
                            {n}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                    {stars > 0 && stars <= 3 ? (
                      <InputField
                        label="What went wrong? (optional)"
                        value={comment}
                        onChangeText={setComment}
                        placeholder="Tell us so we can improve"
                        multiline
                      />
                    ) : null}
                    <Button
                      label="Submit rating"
                      loading={ratingSubmitting}
                      disabled={stars < 1}
                      onPress={async () => {
                        await onRate({ stars, comment: comment.trim() || undefined });
                        resetAndClose();
                      }}
                      fullWidth
                    />
                    <Button
                      label="Not now"
                      variant="ghost"
                      onPress={async () => {
                        await onRate({ dismissed: true });
                        resetAndClose();
                      }}
                      fullWidth
                    />
                  </>
                ) : null}
              </View>
            </ScrollView>
          </Sheet>
        </Overlay>
      </KeyboardAvoidingView>
    </Modal>
  );
}
