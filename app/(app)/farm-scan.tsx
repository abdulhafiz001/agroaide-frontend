import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from '@/design-system/styled';

import { AuthenticatedImage } from '@/components/AuthenticatedImage';
import { ConfirmModal } from '@/components/ConfirmModal';
import { useToast } from '@/components/Toast';
import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';

import { ApiError } from '@/services/apiClient';
import { farmApi } from '@/services/farmApi';
import {
  farmScanApi,
  isSuccessfulScanResult,
  type ScanHistoryItem,
  type ScanResult,
} from '@/services/farmScanApi';
import { useAppStore } from '@/store/useAppStore';
import { useTranslation } from '@/i18n/useTranslation';
import {
  canPollScan,
  getScanStatusMessage,
  normalizeFeedbackReason,
  type ScanVerificationStatus,
} from '@/utils/scanStatus';

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.sm}px ${theme.spacing.md}px`};
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const Container = styled(ScrollView).attrs(({ theme }) => ({
  contentContainerStyle: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl + 40,
  },
}))``;

const ImagePickerArea = styled(TouchableOpacity)`
  height: 260px;
  border-radius: ${({ theme }) => theme.radii.xl}px;
  border-width: 2px;
  border-style: dashed;
  border-color: ${({ theme }) => `${theme.colors.primary}60`};
  background-color: ${({ theme }) => `${theme.colors.surfaceAlt}`};
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin-top: ${({ theme }) => theme.spacing.md}px;
`;

const SelectedImage = styled(Image)`
  width: 100%;
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.xl}px;
`;

const AnalyzingOverlay = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${({ theme }) => theme.colors.overlay};
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.radii.xl}px;
  gap: 12px;
`;

const SectionTitle = styled(Text)`
  margin-top: ${({ theme }) => theme.spacing.lg}px;
  margin-bottom: ${({ theme }) => theme.spacing.xs}px;
`;

const ResultCard = styled(Surface)`
  margin-top: ${({ theme }) => theme.spacing.md}px;
  gap: 12px;
`;

const ConditionBadge = styled.View<{ bg: string }>`
  flex-direction: row;
  align-items: center;
  align-self: flex-start;
  padding: ${({ theme }) => `${theme.spacing.xs}px ${theme.spacing.md}px`};
  border-radius: ${({ theme }) => theme.radii.pill}px;
  background-color: ${({ bg }) => bg};
  gap: 6px;
`;

const DiseaseCard = styled(Surface)`
  background-color: ${({ theme }) => `${theme.colors.danger}10`};
  border-color: ${({ theme }) => `${theme.colors.danger}30`};
  border-width: 1px;
  gap: 10px;
`;

const ProductCard = styled(Surface)`
  background-color: ${({ theme }) => `${theme.colors.success}10`};
  border-color: ${({ theme }) => `${theme.colors.success}30`};
  border-width: 1px;
  gap: 4px;
  padding: ${({ theme }) => theme.spacing.sm}px;
`;

const HistoryOverlay = styled.View`
  flex: 1;
  background-color: rgba(0, 0, 0, 0.45);
  justify-content: flex-end;
`;

const HistorySheet = styled(Surface)`
  max-height: 78%;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px;
  gap: 12px;
`;

const conditionConfig: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  healthy: { icon: 'checkmark-circle', color: '#ffffff', bg: '#2eb873', label: 'Healthy' },
  good: { icon: 'thumbs-up', color: '#ffffff', bg: '#57b346', label: 'Good' },
  fair: { icon: 'alert-circle', color: '#ffffff', bg: '#f1c40f', label: 'Fair' },
  poor: { icon: 'warning', color: '#ffffff', bg: '#e67e22', label: 'Poor' },
  diseased: { icon: 'bug', color: '#ffffff', bg: '#e63946', label: 'Diseased' },
  critical: { icon: 'close-circle', color: '#ffffff', bg: '#c0392b', label: 'Critical' },
  unknown: { icon: 'help-circle', color: '#ffffff', bg: '#95a5a6', label: 'Unknown' },
};

export default function FarmScanScreen() {
  const theme = useTheme();
  const toast = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    fieldId?: string;
    fieldName?: string;
    fieldCrop?: string;
    scanId?: string;
  }>();
  const token = useAppStore((s) => s.accessToken) ?? '';
  const personalDataRevision = useAppStore((s) => s.personalDataRevision);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanId, setScanId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState<ScanVerificationStatus | null>(null);
  const [feedbackReason, setFeedbackReason] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [scanToDelete, setScanToDelete] = useState<ScanHistoryItem | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>(params.fieldId);
  const [seenPersonalDataRevision, setSeenPersonalDataRevision] = useState(personalDataRevision);

  useEffect(() => {
    if (seenPersonalDataRevision === personalDataRevision) return;
    setSeenPersonalDataRevision(personalDataRevision);
    setImageUri(null);
    setImageBase64(null);
    setResult(null);
    setScanId(null);
    setScanStatus(null);
    setFeedbackReason('');
    setShowHistory(false);
  }, [personalDataRevision, seenPersonalDataRevision]);

  const { data: farmData } = useQuery({
    queryKey: ['farmOverview'],
    queryFn: () => farmApi.getOverview(token),
    enabled: Boolean(token),
  });

  const historyQuery = useQuery({
    queryKey: ['scanHistory'],
    queryFn: () => farmScanApi.getHistory(token),
    enabled: Boolean(token) && showHistory,
  });

  const fields = farmData?.fields ?? [];

  const loadScan = useCallback(
    async (id: string) => {
      try {
        const response = await farmScanApi.getScan(token, id);
        const scan = response.scan;
        setScanId(scan.id);
        setScanStatus(scan.verificationStatus ?? scan.status ?? 'completed');
        setResult(isSuccessfulScanResult(scan.analysis) ? scan.analysis : null);
        setFeedbackSubmitted(Boolean(scan.feedback));
        setImageUri(scan.imagePath ?? null);
        setImageBase64(null);
        if (scan.farmFieldId) setSelectedFieldId(scan.farmFieldId);
        setShowHistory(false);
      } catch {
        toast.error('Could not open scan', 'This scan could not be loaded.');
      }
    },
    [toast, token],
  );

  useEffect(() => {
    if (params.scanId) {
      loadScan(String(params.scanId));
    }
  }, [loadScan, params.scanId]);

  const analyzeMutation = useMutation({
    mutationFn: () => {
      if (!imageBase64) throw new Error('No image selected');
      return farmScanApi.analyzeImage(token, imageBase64, selectedFieldId);
    },
    onSuccess: (data) => {
      setResult(isSuccessfulScanResult(data.analysis) ? data.analysis : null);
      setScanId(data.scanId ?? null);
      setScanStatus(data.status ?? (isSuccessfulScanResult(data.analysis) ? 'completed' : 'queued'));
      queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
    },
    onError: (error: Error) => {
      const isLimit = error instanceof ApiError && error.statusCode === 429;
      toast.error(
        isLimit ? 'Daily limit reached' : 'Scan failed',
        error.message || 'Could not analyze the image. Please try again.',
      );
    },
  });

  const statusQuery = useQuery({
    queryKey: ['farmScan', scanId, 'status'],
    queryFn: () => farmScanApi.getScanStatus(token, scanId!),
    enabled: Boolean(token && scanId && scanStatus && canPollScan(scanStatus)),
    refetchInterval: (query) => {
      const status = query.state.data?.scan.verificationStatus ?? query.state.data?.scan.status ?? scanStatus;
      return status && canPollScan(status) ? 3000 : false;
    },
  });

  useEffect(() => {
    const scan = statusQuery.data?.scan;
    if (!scan) return;
    const nextStatus = scan.verificationStatus ?? scan.status ?? 'completed';
    setScanStatus(nextStatus);
    if (isSuccessfulScanResult(scan.analysis)) {
      setResult(scan.analysis);
    } else if (nextStatus === 'failed' || nextStatus === 'rejected') {
      setResult(null);
    }
    if (scan.feedback) setFeedbackSubmitted(true);
  }, [statusQuery.data?.scan]);

  const feedbackMutation = useMutation({
    mutationFn: (accurate: boolean) =>
      farmScanApi.submitFeedback(token, scanId!, {
        accurate,
        reason: normalizeFeedbackReason(feedbackReason),
      }),
    onSuccess: () => {
      toast.success('Thank you', 'Your feedback will help verify crop scan results.');
      setFeedbackReason('');
      setFeedbackSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
    },
    onError: () => toast.error('Could not send feedback', 'Please try again.'),
  });

  const deleteScanMutation = useMutation({
    mutationFn: (id: string) => farmScanApi.deleteScan(token, id),
    onSuccess: (_data, deletedId) => {
      toast.success('Scan deleted', 'The scan and its image were removed.');
      if (scanId === deletedId) {
        resetScan();
      }
      setScanToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['scanHistory'] });
    },
    onError: () => toast.error('Could not delete scan', 'Please try again.'),
  });

  const pickImage = useCallback(
    async (source: 'camera' | 'library') => {
      const permissionResult =
        source === 'camera'
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        toast.error('Permission required', `Please allow ${source} access to scan your farm.`);
        return;
      }

      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        quality: 0.7,
        base64: true,
        allowsEditing: false,
      };

      const pickerResult =
        source === 'camera'
          ? await ImagePicker.launchCameraAsync(options)
          : await ImagePicker.launchImageLibraryAsync(options);

      if (!pickerResult.canceled && pickerResult.assets[0]) {
        const asset = pickerResult.assets[0];
        setImageUri(asset.uri);
        setImageBase64(asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : null);
        setResult(null);
        setScanId(null);
        setFeedbackSubmitted(false);
      }
    },
    [toast],
  );

  const showImageSourcePicker = useCallback(() => {
    if (Platform.OS === 'web') {
      pickImage('library');
      return;
    }
    Alert.alert('Select Image Source', 'Choose how to capture your farm image', [
      { text: 'Camera', onPress: () => pickImage('camera') },
      { text: 'Gallery', onPress: () => pickImage('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [pickImage]);

  const resetScan = () => {
    setImageUri(null);
    setImageBase64(null);
    setResult(null);
    setScanId(null);
    setScanStatus(null);
    setFeedbackReason('');
    setFeedbackSubmitted(false);
  };

  const askAdvisorAboutScan = () => {
    if (!scanId || !result) return;
    router.push({
      pathname: '/(app)/(tabs)/advisor',
      params: { scanId },
    });
  };

  const isAnalyzing = analyzeMutation.isPending;
  const selectedField = fields.find((f) => f.id === selectedFieldId);
  const cfg = result ? conditionConfig[result.condition] || conditionConfig.unknown : null;
  const history = historyQuery.data?.history ?? [];

  return (
    <Screen>
      <Header style={{ backgroundColor: theme.colors.primary }}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <Ionicons name="scan" size={22} color="#fff" />
        <Text variant="title" style={{ flex: 1, color: '#fff', fontWeight: '700' }}>
          {t('cropScanner')}
        </Text>
        <TouchableOpacity
          onPress={() => setShowHistory(true)}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Open scan history"
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <Ionicons name="time-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </Header>

      <Container>
        <Surface rounded="lg" padding="sm" style={{ gap: 8 }}>
          <Text variant="caption" tone="muted">
            {t('scanningFor')}:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip
                label={t('generalFarm')}
                tone={!selectedFieldId ? 'success' : 'default'}
                onPress={() => setSelectedFieldId(undefined)}
              />
              {fields.map((f) => (
                <Chip
                  key={f.id}
                  label={`${f.name} (${f.crop})`}
                  tone={selectedFieldId === f.id ? 'success' : 'default'}
                  onPress={() => setSelectedFieldId(f.id)}
                />
              ))}
            </View>
          </ScrollView>
        </Surface>

        <ImagePickerArea
          onPress={showImageSourcePicker}
          activeOpacity={0.7}
          disabled={isAnalyzing}
          accessibilityRole="button"
          accessibilityLabel={imageUri ? 'Change crop image' : 'Choose a crop image'}
          accessibilityState={{ disabled: isAnalyzing }}>
          {imageUri ? (
            <>
              {imageUri.startsWith('file:') ||
              imageUri.startsWith('content:') ||
              imageUri.startsWith('data:') ||
              imageUri.startsWith('http') ? (
                <SelectedImage source={{ uri: imageUri }} resizeMode="cover" />
              ) : (
                <AuthenticatedImage
                  uri={imageUri}
                  style={{ width: '100%', height: '100%', borderRadius: theme.radii.xl }}
                  contentFit="cover"
                />
              )}
              {isAnalyzing && (
                <AnalyzingOverlay>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text variant="headline" style={{ color: '#fff' }}>
                    {t('analyzingCrops')}
                  </Text>
                  <Text
                    variant="caption"
                    style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingHorizontal: 32 }}
                  >
                    Our AI is examining the image with your farm&apos;s context. This may take a moment.
                  </Text>
                </AnalyzingOverlay>
              )}
            </>
          ) : (
            <View style={{ alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: `${theme.colors.primary}20`,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="camera" size={32} color={theme.colors.primary} />
              </View>
              <Text variant="headline" tone="muted">
                {t('tapToCapture')}
              </Text>
              <Text variant="caption" tone="muted" style={{ textAlign: 'center', paddingHorizontal: 32 }}>
                Take a clear photo of your crops, leaves, or field for AI-powered diagnosis
              </Text>
            </View>
          )}
        </ImagePickerArea>

        {imageUri && !isAnalyzing && (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <Button
              label={t('changeImage')}
              variant="ghost"
              icon={<Ionicons name="images-outline" size={18} color={theme.colors.accent} />}
              onPress={showImageSourcePicker}
              style={{ flex: 1 }}
            />
            <Button
              label={result ? t('scanAgain') : t('analyzeCrop')}
              icon={<Ionicons name="scan" size={18} color="#fff" />}
              onPress={() => analyzeMutation.mutate()}
              disabled={!imageBase64}
              style={{ flex: 1 }}
            />
          </View>
        )}

        {scanStatus ? (
          <Surface rounded="lg" variant="muted" style={{ marginTop: 12, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {canPollScan(scanStatus) ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
              <Text variant="headline" accessibilityLiveRegion="polite">
                {getScanStatusMessage(scanStatus)}
              </Text>
            </View>
            {canPollScan(scanStatus) ? (
              <Text variant="caption" tone="muted">
                This page checks automatically. You can leave and return from scan history.
              </Text>
            ) : null}
          </Surface>
        ) : null}

        {result && cfg && (
          <View style={{ gap: 0 }}>
            <ResultCard rounded="xl" variant="elevated">
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <ConditionBadge bg={cfg.bg}>
                  <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
                  <Text variant="headline" style={{ color: cfg.color }}>
                    {result.conditionLabel}
                  </Text>
                </ConditionBadge>
                <Chip label={`${result.confidencePercent}% confidence`} tone="info" />
              </View>

              <Text variant="body">{result.summary}</Text>

              {result.details && (
                <View style={{ gap: 6, marginTop: 4 }}>
                  {result.details.plantsVisible ? (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Ionicons name="leaf-outline" size={16} color={theme.colors.textSecondary} />
                      <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                        {result.details.plantsVisible}
                      </Text>
                    </View>
                  ) : null}
                  {result.details.growthStage ? (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Ionicons name="trending-up-outline" size={16} color={theme.colors.textSecondary} />
                      <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                        Growth stage: {result.details.growthStage}
                      </Text>
                    </View>
                  ) : null}
                </View>
              )}
            </ResultCard>

            {result.disease && result.condition !== 'unknown' ? (
              <>
                <SectionTitle variant="headline">
                  <Ionicons name="bug-outline" size={18} color={theme.colors.danger} /> {t('diseaseDetected')}
                </SectionTitle>
                <DiseaseCard rounded="xl">
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="headline">{result.disease.name}</Text>
                    <Chip
                      label={result.disease.severity}
                      tone={
                        result.disease.severity === 'severe'
                          ? 'danger'
                          : result.disease.severity === 'moderate'
                            ? 'warning'
                            : 'info'
                      }
                    />
                  </View>
                  <Text variant="body" tone="muted">
                    <Text variant="caption" style={{ fontWeight: '700' }}>
                      Cause:{' '}
                    </Text>
                    {result.disease.cause}
                  </Text>
                  {(result.disease.symptoms ?? []).map((s, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 6, paddingLeft: 4 }}>
                      <Text variant="caption" tone="danger">
                        •
                      </Text>
                      <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                        {s}
                      </Text>
                    </View>
                  ))}
                </DiseaseCard>
              </>
            ) : null}

            {result.disease && result.condition !== 'unknown' && result.condition !== 'healthy' && result.condition !== 'good' ? (
              <>
                <SectionTitle variant="headline">
                  <Ionicons name="bulb-outline" size={18} color={theme.colors.accent} /> {t('whatToDo')}
                </SectionTitle>

                {(result.recommendations?.immediate ?? []).map((r, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: `${theme.colors.accent}20`,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text variant="caption" style={{ fontWeight: '700', color: theme.colors.accent, fontSize: 11 }}>
                        {i + 1}
                      </Text>
                    </View>
                    <Text variant="body" style={{ flex: 1 }}>
                      {r}
                    </Text>
                  </View>
                ))}

                {(result.recommendations?.products ?? []).map((p, i) => (
                  <ProductCard key={i} rounded="lg">
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="flask-outline" size={16} color={theme.colors.success} />
                      <Text variant="headline" style={{ flex: 1 }}>
                        {p.name}
                      </Text>
                      <Chip label={p.type} tone="success" />
                    </View>
                    <Text variant="caption" tone="muted">
                      {p.usage}
                    </Text>
                  </ProductCard>
                ))}
              </>
            ) : null}

            {result.personalizedNote ? (
              <Surface
                rounded="xl"
                style={{ marginTop: 16, gap: 8, borderLeftWidth: 4, borderLeftColor: theme.colors.primary }}
                variant="elevated"
              >
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Ionicons name="leaf" size={18} color={theme.colors.primary} />
                  <Text variant="caption" style={{ fontWeight: '700', color: theme.colors.primary }}>
                    {t('personalizedForYou')}
                  </Text>
                </View>
                <Text variant="body">{result.personalizedNote}</Text>
              </Surface>
            ) : null}

            {scanId && result ? (
              <>
                {!feedbackSubmitted && result.condition !== 'unknown' ? (
                  <Surface rounded="lg" variant="muted" style={{ marginTop: 20, gap: 10 }}>
                    <Text variant="headline">Was this scan accurate?</Text>
                    <InputField
                      label="Optional note"
                      value={feedbackReason}
                      onChangeText={setFeedbackReason}
                      placeholder="Tell us what looked wrong"
                    />
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Button
                        label="Yes"
                        variant="secondary"
                        onPress={() => feedbackMutation.mutate(true)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        label="Needs review"
                        variant="secondary"
                        onPress={() => feedbackMutation.mutate(false)}
                        style={{ flex: 1 }}
                      />
                    </View>
                  </Surface>
                ) : null}
                <Button
                  label="Enquire more details"
                  icon={<Ionicons name="chatbubble-ellipses" size={18} color="#fff" />}
                  onPress={askAdvisorAboutScan}
                  style={{ marginTop: 12 }}
                  fullWidth
                />
              </>
            ) : null}

            <Button
              label={t('scanAnother')}
              variant="ghost"
              icon={<Ionicons name="refresh" size={18} color={theme.colors.accent} />}
              onPress={resetScan}
              style={{ marginTop: 12 }}
              fullWidth
            />
          </View>
        )}

        {!imageUri && !result ? (
          <Surface rounded="lg" variant="muted" style={{ marginTop: 20, gap: 8, alignItems: 'center', paddingVertical: 20 }}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.info} />
            <Text variant="body" tone="muted" style={{ textAlign: 'center' }}>
              For best results, take a close-up photo of the leaves or affected area in good lighting.
            </Text>
            {selectedField ? (
              <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                Scanning: <Text variant="caption" style={{ fontWeight: '700' }}>{selectedField.name}</Text> ({selectedField.crop})
              </Text>
            ) : null}
          </Surface>
        ) : null}
      </Container>

      <Modal visible={showHistory} transparent animationType="slide" onRequestClose={() => setShowHistory(false)}>
        <HistoryOverlay>
          <HistorySheet>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="headline">Scan history</Text>
              <TouchableOpacity
                onPress={() => setShowHistory(false)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close scan history">
                <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text variant="caption" tone="muted">
              Tap a past scan to reopen its results.
            </Text>

            {historyQuery.isLoading ? (
              <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 24 }} />
            ) : history.length === 0 ? (
              <Surface variant="muted" style={{ padding: 20, alignItems: 'center', gap: 8 }}>
                <Ionicons name="images-outline" size={28} color={theme.colors.textSecondary} />
                <Text tone="muted">No crop scans yet.</Text>
              </Surface>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <View style={{ gap: 10 }}>
                  {history.map((item: ScanHistoryItem) => {
                    const itemCfg = conditionConfig[item.condition] || conditionConfig.unknown;
                    return (
                      <View key={item.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <TouchableOpacity
                          onPress={() => loadScan(item.id)}
                          activeOpacity={0.8}
                          style={{ flex: 1 }}
                          accessibilityRole="button"
                          accessibilityLabel={`Open scan from ${new Date(item.date).toLocaleDateString()}`}>
                          <Surface rounded="xl" style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                            {item.imagePath ? (
                              <AuthenticatedImage
                                uri={item.imagePath}
                                style={{ width: 64, height: 64, borderRadius: 14 }}
                                contentFit="cover"
                              />
                            ) : (
                              <View
                                style={{
                                  width: 64,
                                  height: 64,
                                  borderRadius: 14,
                                  backgroundColor: `${itemCfg.bg}33`,
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Ionicons name="leaf" size={22} color={itemCfg.bg} />
                              </View>
                            )}
                            <View style={{ flex: 1, gap: 4 }}>
                              <Text variant="headline" numberOfLines={1}>
                                {item.diseaseName || item.conditionLabel || item.condition}
                              </Text>
                              <Text variant="caption" tone="muted" numberOfLines={2}>
                                {item.summary || 'Open to view full scan details'}
                              </Text>
                              <Text variant="caption" tone="muted">
                                {item.fieldName ? `${item.fieldName} · ` : ''}
                                {new Date(item.date).toLocaleDateString()}
                              </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
                          </Surface>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => setScanToDelete(item)}
                          hitSlop={10}
                          accessibilityRole="button"
                          accessibilityLabel="Delete scan"
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: `${theme.colors.danger}14`,
                          }}
                        >
                          <Ionicons name="trash-outline" size={18} color={theme.colors.danger} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </HistorySheet>
        </HistoryOverlay>
      </Modal>

      <ConfirmModal
        visible={Boolean(scanToDelete)}
        title="Delete this scan?"
        message="This permanently removes the scan result and the photo from AgroAide."
        confirmLabel="Delete"
        destructive
        loading={deleteScanMutation.isPending}
        onCancel={() => setScanToDelete(null)}
        onConfirm={() => {
          if (scanToDelete) deleteScanMutation.mutate(scanToDelete.id);
        }}
      />
    </Screen>
  );
}
