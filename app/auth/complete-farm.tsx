import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import styled, { useTheme } from '@/design-system/styled';

import { LocationMapPreview } from '@/components/LocationMapPreview';
import type { LeafletMapHandle } from '@/components/LeafletMap';
import { CropTagsInput } from '@/components/CropTagsInput';
import { useToast } from '@/components/Toast';
import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';
import { ApiError } from '@/services/apiClient';
import { authApi } from '@/services/authApi';
import { useAppStore } from '@/store/useAppStore';
import type { ExperienceLevel } from '@/types/farmer';
import { formatSquareSidesFt } from '@/utils/formatters';

const LOCATIONIQ_KEY = process.env.EXPO_PUBLIC_LOCATIONIQ_KEY || '';

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Content = styled.ScrollView.attrs({
  contentContainerStyle: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    gap: 20,
  },
  keyboardShouldPersistTaps: 'handled' as const,
})``;

const Card = styled(Surface)`
  gap: ${({ theme }) => theme.spacing.md}px;
`;

const StepRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const StepDot = styled.View<{ active: boolean; completed: boolean }>`
  width: ${({ active }) => (active ? 24 : 8)}px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ theme, active, completed }) =>
    active || completed ? theme.colors.primary : theme.colors.border};
`;

const ButtonRow = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const SearchResultItem = styled.TouchableOpacity`
  padding: 12px 16px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }) => theme.colors.border};
`;

type LocationResult = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
};

const experienceOptions: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];
const irrigationOptions = ['rain-fed', 'drip', 'sprinkler', 'flood'] as const;

export default function CompleteFarmScreen() {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const queryClient = useQueryClient();
  const accessToken = useAppStore((s) => s.accessToken);
  const profile = useAppStore((s) => s.farmerProfile);
  const setProfile = useAppStore((s) => s.setFarmerProfile);

  const [step, setStep] = useState(1);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<LeafletMapHandle | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [farmName, setFarmName] = useState(profile?.farmName && profile.farmName !== 'My Farm' ? profile.farmName : '');
  const [farmSizeM2, setFarmSizeM2] = useState(
    profile?.farmSizeM2 ? String(profile.farmSizeM2) : '',
  );
  const [soilType, setSoilType] = useState(profile?.soilType && profile.soilType !== 'Loamy' ? profile.soilType : '');
  const [irrigationAccess, setIrrigationAccess] = useState<(typeof irrigationOptions)[number]>(
    profile?.irrigationAccess ?? 'drip',
  );
  const [crops, setCrops] = useState<string[]>(profile?.crops?.length ? [...profile.crops] : []);
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(profile?.experienceLevel ?? 'beginner');
  const [farmLocation, setFarmLocation] = useState(
    profile?.farmLocation && profile.farmLocation !== 'Unknown location' ? profile.farmLocation : '',
  );
  const [farmLatitude, setFarmLatitude] = useState<number | null>(profile?.farmLatitude ?? null);
  const [farmLongitude, setFarmLongitude] = useState<number | null>(profile?.farmLongitude ?? null);
  const [locationQuery, setLocationQuery] = useState(farmLocation);
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [gettingGPS, setGettingGPS] = useState(false);

  const animateStep = useCallback(
    (newStep: number) => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
        setStep(newStep);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    },
    [fadeAnim],
  );

  const searchLocation = useCallback((query: string) => {
    setLocationQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (query.length < 3) {
      setLocationResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://us1.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(query)}&countrycodes=ng&limit=5&format=json`,
        );
        const data = await res.json();
        if (Array.isArray(data)) setLocationResults(data);
      } catch {
        // ignore
      } finally {
        setSearching(false);
      }
    }, 400);
  }, []);

  const selectLocation = useCallback((item: LocationResult) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    setFarmLocation(item.display_name);
    setFarmLatitude(lat);
    setFarmLongitude(lng);
    setLocationQuery(item.display_name);
    setLocationResults([]);
    mapRef.current?.animateToRegion?.(
      { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      600,
    );
  }, []);

  const useGPSLocation = useCallback(async () => {
    setGettingGPS(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.error('Permission denied', 'Please allow location access to use this feature.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setFarmLatitude(lat);
      setFarmLongitude(lng);
      try {
        const res = await fetch(
          `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_KEY}&lat=${lat}&lon=${lng}&format=json`,
        );
        const data = await res.json();
        if (data?.display_name) {
          setFarmLocation(data.display_name);
          setLocationQuery(data.display_name);
        }
      } catch {
        const label = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setFarmLocation(label);
        setLocationQuery(label);
      }
      mapRef.current?.animateToRegion?.(
        { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        600,
      );
    } catch (e: any) {
      toast.error('Location error', e.message || 'Could not get your location.');
    } finally {
      setGettingGPS(false);
    }
  }, [toast]);

  const canContinue = useMemo(() => Boolean(farmName.trim() || crops.length), [crops, farmName]);
  const canSave = farmLatitude != null && farmLongitude != null;

  const mutation = useMutation({
    mutationFn: () => {
      const size = farmSizeM2 ? Number(farmSizeM2) : undefined;

      return authApi.updateProfile(accessToken ?? '', {
        farmName: farmName.trim() || undefined,
        farmLocation: farmLocation || undefined,
        farmLatitude,
        farmLongitude,
        ...(typeof size === 'number' && !Number.isNaN(size) ? { farmSizeM2: size } : {}),
        ...(soilType ? { soilType } : {}),
        ...(crops.length ? { crops } : {}),
        experienceLevel,
        irrigationAccess,
      });
    },
    onSuccess: async (response) => {
      setProfile(response.profile);
      await queryClient.invalidateQueries({ queryKey: ['dashboardSnapshot'] });
      await queryClient.invalidateQueries({ queryKey: ['farmOverview'] });
      await queryClient.invalidateQueries({ queryKey: ['marketIntel'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboardAiInsights'] });
      await queryClient.invalidateQueries({ queryKey: ['advisorWeatherContext'] });
      toast.success('Farm profile saved', 'Your dashboard is ready with local weather and insights.');
      router.replace('/(app)/(tabs)/dashboard');
    },
    onError: (error) => {
      const message = error instanceof ApiError ? error.message : 'Could not save farm details.';
      toast.error('Save failed', message);
    },
  });

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Content>
          <StepRow>
            <StepDot active={step === 1} completed={step > 1} />
            <StepDot active={step === 2} completed={false} />
          </StepRow>
          <Text variant="eyebrow" tone="accent">
            {step === 1 ? 'Complete your farm' : 'Farm location'}
          </Text>
          <Text variant="display">{step === 1 ? 'Tell us about your farm' : 'Where is your farm?'}</Text>
          <Text variant="body" tone="muted">
            {step === 1
              ? 'Primary crops are the main crops you grow — we use them for disease alerts, market prices, and AI advice.'
              : 'We need your farm GPS so weather, soil, and nearby disease warnings match your land — not someone else’s.'}
          </Text>

          <Animated.View style={{ opacity: fadeAnim }}>
            {step === 1 ? (
              <Card rounded="xl">
                <InputField label="Farm name" value={farmName} onChangeText={setFarmName} placeholder="e.g. Green Valley Farm" />
                <CropTagsInput
                  value={crops}
                  onChange={setCrops}
                  placeholder="e.g. Maize,"
                  hint="Add each crop with a comma. Disease alerts and market tips match these cards."
                />
                <InputField
                  label="Farm size (m²)"
                  value={farmSizeM2}
                  onChangeText={setFarmSizeM2}
                  keyboardType="decimal-pad"
                />
                {farmSizeM2 && formatSquareSidesFt(Number(farmSizeM2)) ? (
                  <Text variant="caption" tone="muted">
                    ≈ {formatSquareSidesFt(Number(farmSizeM2))} (square plot estimate)
                  </Text>
                ) : null}
                <InputField
                  label="Soil type"
                  value={soilType}
                  onChangeText={setSoilType}
                  placeholder="e.g. Loamy, Clay, Sandy"
                />
                <Text variant="caption" tone="muted">
                  Irrigation method
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {irrigationOptions.map((opt) => (
                    <Chip
                      key={opt}
                      label={opt}
                      tone={irrigationAccess === opt ? 'success' : 'default'}
                      onPress={() => setIrrigationAccess(opt)}
                    />
                  ))}
                </View>
                <Text variant="caption" tone="muted">
                  Experience level
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  {experienceOptions.map((opt) => (
                    <Chip
                      key={opt}
                      label={opt}
                      tone={experienceLevel === opt ? 'success' : 'default'}
                      onPress={() => setExperienceLevel(opt)}
                    />
                  ))}
                </View>
                <Button label="Next" onPress={() => animateStep(2)} fullWidth disabled={!canContinue} />
              </Card>
            ) : (
              <Card rounded="xl">
                <TouchableOpacity
                  onPress={useGPSLocation}
                  disabled={gettingGPS}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    paddingVertical: 14,
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: theme.colors.primary,
                    backgroundColor: `${theme.colors.primary}10`,
                  }}
                >
                  {gettingGPS ? (
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  ) : (
                    <Ionicons name="locate" size={20} color={theme.colors.primary} />
                  )}
                  <Text variant="body" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                    {gettingGPS ? 'Getting location...' : 'Use my precise location'}
                  </Text>
                </TouchableOpacity>

                <InputField
                  label="Search for your farm"
                  value={locationQuery}
                  onChangeText={searchLocation}
                  placeholder="Type an address or area..."
                />
                {searching ? <ActivityIndicator size="small" color={theme.colors.primary} /> : null}
                {locationResults.length > 0 ? (
                  <Surface variant="muted" style={{ maxHeight: 180, borderRadius: 12, overflow: 'hidden' }}>
                    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                      {locationResults.map((item) => (
                        <SearchResultItem key={item.place_id} onPress={() => selectLocation(item)}>
                          <Text variant="body" numberOfLines={2}>
                            {item.display_name}
                          </Text>
                        </SearchResultItem>
                      ))}
                    </ScrollView>
                  </Surface>
                ) : null}

                {farmLatitude != null && farmLongitude != null ? (
                  <>
                    <View style={{ height: 200, borderRadius: 16, overflow: 'hidden', marginTop: 8 }}>
                      <LocationMapPreview ref={mapRef} latitude={farmLatitude} longitude={farmLongitude} />
                    </View>
                    <Chip
                      label={
                        farmLocation.substring(0, 60) + (farmLocation.length > 60 ? '...' : '')
                      }
                      tone="success"
                    />
                  </>
                ) : null}

                <ButtonRow>
                  <Button label="Back" variant="ghost" onPress={() => animateStep(1)} style={{ flex: 1 }} />
                  <Button
                    label="Save & continue"
                    onPress={() => mutation.mutate()}
                    loading={mutation.isPending}
                    disabled={!canSave}
                    style={{ flex: 1 }}
                  />
                </ButtonRow>
              </Card>
            )}
          </Animated.View>
        </Content>
      </KeyboardAvoidingView>
    </Screen>
  );
}
