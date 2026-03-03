import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { Button, Chip, Surface, Text } from '@/design-system/components';
import styled from '@/design-system/styled';
import { farmApi } from '@/services/farmApi';
import { farmScanApi, type ScanResult } from '@/services/farmScanApi';
import { useAppStore } from '@/store/useAppStore';

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
  const router = useRouter();
  const params = useLocalSearchParams<{ fieldId?: string; fieldName?: string; fieldCrop?: string }>();
  const token = useAppStore((s) => s.accessToken) ?? '';

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);

  const { data: farmData } = useQuery({
    queryKey: ['farmOverview'],
    queryFn: () => farmApi.getOverview(token),
    enabled: Boolean(token),
  });

  const fields = farmData?.fields ?? [];

  const [selectedFieldId, setSelectedFieldId] = useState<string | undefined>(params.fieldId);

  const analyzeMutation = useMutation({
    mutationFn: () => {
      if (!imageBase64) throw new Error('No image selected');
      return farmScanApi.analyzeImage(token, imageBase64, selectedFieldId);
    },
    onSuccess: (data) => {
      setResult(data.analysis);
    },
    onError: (error: Error) => {
      Alert.alert('Scan Failed', error.message || 'Could not analyze the image. Please try again.');
    },
  });

  const pickImage = useCallback(async (source: 'camera' | 'library') => {
    const permissionResult =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', `Please allow ${source} access to scan your farm.`);
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
    }
  }, []);

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
  };

  const isAnalyzing = analyzeMutation.isPending;
  const selectedField = fields.find((f) => f.id === selectedFieldId);
  const cfg = result ? conditionConfig[result.condition] || conditionConfig.unknown : null;

  return (
    <Screen>
      <Header>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Ionicons name="scan" size={22} color={theme.colors.primary} />
        <Text variant="title" style={{ flex: 1 }}>
          Crop Scanner
        </Text>
      </Header>

      <Container>
        {/* Field Selector */}
        <Surface rounded="lg" padding="sm" style={{ gap: 8 }}>
          <Text variant="caption" tone="muted">
            Scanning for:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip
                label="General Farm"
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

        {/* Image Picker */}
        <ImagePickerArea onPress={showImageSourcePicker} activeOpacity={0.7} disabled={isAnalyzing}>
          {imageUri ? (
            <>
              <SelectedImage source={{ uri: imageUri }} resizeMode="cover" />
              {isAnalyzing && (
                <AnalyzingOverlay>
                  <ActivityIndicator size="large" color={theme.colors.primary} />
                  <Text variant="headline" style={{ color: '#fff' }}>
                    Analyzing your crops...
                  </Text>
                  <Text variant="caption" style={{ color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingHorizontal: 32 }}>
                    Our AI is examining the image with your farm's context. This may take a moment.
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
                Tap to capture or select a photo
              </Text>
              <Text variant="caption" tone="muted" style={{ textAlign: 'center', paddingHorizontal: 32 }}>
                Take a clear photo of your crops, leaves, or field for AI-powered diagnosis
              </Text>
            </View>
          )}
        </ImagePickerArea>

        {/* Action Buttons */}
        {imageUri && !isAnalyzing && (
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
            <Button
              label="Change Image"
              variant="ghost"
              icon={<Ionicons name="images-outline" size={18} color={theme.colors.accent} />}
              onPress={showImageSourcePicker}
              style={{ flex: 1 }}
            />
            <Button
              label={result ? 'Scan Again' : 'Analyze Crop'}
              icon={<Ionicons name="scan" size={18} color="#fff" />}
              onPress={() => analyzeMutation.mutate()}
              disabled={!imageBase64}
              style={{ flex: 1 }}
            />
          </View>
        )}

        {/* Analysis Result */}
        {result && cfg && (
          <View style={{ gap: 0 }}>
            {/* Condition Overview */}
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
                  {result.details.plantsVisible && (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Ionicons name="leaf-outline" size={16} color={theme.colors.textSecondary} />
                      <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                        {result.details.plantsVisible}
                      </Text>
                    </View>
                  )}
                  {result.details.growthStage && (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Ionicons name="trending-up-outline" size={16} color={theme.colors.textSecondary} />
                      <Text variant="caption" tone="muted" style={{ flex: 1 }}>
                        Growth stage: {result.details.growthStage}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {result.plantIdentification && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Ionicons name="search" size={14} color={theme.colors.info} />
                  <Text variant="caption" tone="muted">
                    Identified: {result.plantIdentification.commonNames?.[0] || result.plantIdentification.scientificName}
                    {' '}({result.plantIdentification.score}% match)
                  </Text>
                </View>
              )}
            </ResultCard>

            {/* Disease Section */}
            {result.disease && (
              <>
                <SectionTitle variant="headline">
                  <Ionicons name="bug-outline" size={18} color={theme.colors.danger} /> Disease Detected
                </SectionTitle>
                <DiseaseCard rounded="xl">
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text variant="headline">{result.disease.name}</Text>
                    <Chip
                      label={result.disease.severity}
                      tone={result.disease.severity === 'severe' ? 'danger' : result.disease.severity === 'moderate' ? 'warning' : 'info'}
                    />
                  </View>
                  {result.disease.scientificName && (
                    <Text variant="caption" tone="muted" style={{ fontStyle: 'italic' }}>
                      {result.disease.scientificName}
                    </Text>
                  )}
                  <Text variant="body" tone="muted">
                    <Text variant="caption" style={{ fontWeight: '700' }}>Cause: </Text>
                    {result.disease.cause}
                  </Text>

                  <Text variant="caption" style={{ fontWeight: '700', marginTop: 4 }}>Symptoms:</Text>
                  {result.disease.symptoms.map((s, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 6, paddingLeft: 4 }}>
                      <Text variant="caption" tone="danger">•</Text>
                      <Text variant="caption" tone="muted" style={{ flex: 1 }}>{s}</Text>
                    </View>
                  ))}

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                    <Chip label={`Spread risk: ${result.disease.spreadRisk}`} tone={result.disease.spreadRisk === 'high' ? 'danger' : 'warning'} />
                  </View>
                </DiseaseCard>
              </>
            )}

            {/* Recommendations */}
            <SectionTitle variant="headline">
              <Ionicons name="bulb-outline" size={18} color={theme.colors.accent} /> What To Do
            </SectionTitle>

            {result.recommendations.immediate.length > 0 && (
              <Surface rounded="lg" style={{ gap: 8, marginBottom: 10 }}>
                <Text variant="caption" style={{ fontWeight: '700', color: theme.colors.accent }}>
                  TAKE ACTION NOW
                </Text>
                {result.recommendations.immediate.map((r, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: `${theme.colors.accent}20`, alignItems: 'center', justifyContent: 'center' }}>
                      <Text variant="caption" style={{ fontWeight: '700', color: theme.colors.accent, fontSize: 11 }}>{i + 1}</Text>
                    </View>
                    <Text variant="body" style={{ flex: 1 }}>{r}</Text>
                  </View>
                ))}
              </Surface>
            )}

            {result.recommendations.products.length > 0 && (
              <>
                <Text variant="caption" style={{ fontWeight: '700', marginBottom: 6, marginTop: 4 }}>
                  RECOMMENDED PRODUCTS
                </Text>
                {result.recommendations.products.map((p, i) => (
                  <ProductCard key={i} rounded="lg">
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="flask-outline" size={16} color={theme.colors.success} />
                      <Text variant="headline" style={{ flex: 1 }}>{p.name}</Text>
                      <Chip label={p.type} tone="success" />
                    </View>
                    <Text variant="caption" tone="muted">{p.usage}</Text>
                  </ProductCard>
                ))}
              </>
            )}

            {result.recommendations.prevention.length > 0 && (
              <Surface rounded="lg" style={{ gap: 8, marginTop: 10 }} variant="muted">
                <Text variant="caption" style={{ fontWeight: '700', color: theme.colors.info }}>
                  PREVENTION TIPS
                </Text>
                {result.recommendations.prevention.map((p, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                    <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.info} />
                    <Text variant="body" style={{ flex: 1 }}>{p}</Text>
                  </View>
                ))}
              </Surface>
            )}

            {result.recommendations.longTerm && result.recommendations.longTerm.length > 0 && (
              <Surface rounded="lg" style={{ gap: 8, marginTop: 10 }} variant="muted">
                <Text variant="caption" style={{ fontWeight: '700' }}>
                  LONG-TERM ADVICE
                </Text>
                {result.recommendations.longTerm.map((l, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                    <Ionicons name="calendar-outline" size={16} color={theme.colors.textSecondary} />
                    <Text variant="body" style={{ flex: 1 }}>{l}</Text>
                  </View>
                ))}
              </Surface>
            )}

            {/* Personalized Note */}
            {result.personalizedNote && (
              <Surface rounded="xl" style={{ marginTop: 16, gap: 8, borderLeftWidth: 4, borderLeftColor: theme.colors.primary }} variant="elevated">
                <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                  <Ionicons name="leaf" size={18} color={theme.colors.primary} />
                  <Text variant="caption" style={{ fontWeight: '700', color: theme.colors.primary }}>
                    PERSONALIZED FOR YOUR FARM
                  </Text>
                </View>
                <Text variant="body">{result.personalizedNote}</Text>
              </Surface>
            )}

            {/* New Scan */}
            <Button
              label="Scan Another Image"
              variant="ghost"
              icon={<Ionicons name="refresh" size={18} color={theme.colors.accent} />}
              onPress={resetScan}
              style={{ marginTop: 20 }}
              fullWidth
            />
          </View>
        )}

        {/* Empty state tip */}
        {!imageUri && !result && (
          <Surface rounded="lg" variant="muted" style={{ marginTop: 20, gap: 8, alignItems: 'center', paddingVertical: 20 }}>
            <Ionicons name="information-circle-outline" size={24} color={theme.colors.info} />
            <Text variant="body" tone="muted" style={{ textAlign: 'center' }}>
              For best results, take a close-up photo of the leaves or affected area in good lighting.
            </Text>
            {selectedField && (
              <Text variant="caption" tone="muted" style={{ textAlign: 'center' }}>
                Scanning: <Text variant="caption" style={{ fontWeight: '700' }}>{selectedField.name}</Text> ({selectedField.crop})
              </Text>
            )}
          </Surface>
        )}
      </Container>
    </Screen>
  );
}
