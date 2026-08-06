import { useMutation, useQuery } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LocationMapPreview } from '@/components/LocationMapPreview';
import type { LeafletMapHandle } from '@/components/LeafletMap';
import styled, { useTheme } from '@/design-system/styled';


import { useToast } from '@/components/Toast';
import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';
import { ApiError } from '@/services/apiClient';
import { authApi } from '@/services/authApi';
import { clearAllSyncActions } from '@/services/syncQueue';
import { useAppStore } from '@/store/useAppStore';
import type { ExperienceLevel } from '@/types/farmer';
import { isFarmProfileComplete } from '@/utils/farmProfile';
import { formatSquareSidesFt } from '@/utils/formatters';
import { clearAuthQueryCache } from '@/utils/queryClient';
import { authStorage } from '@/utils/authStorage';

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
  margin-bottom: 4px;
`;

const StepDot = styled.View<{ active: boolean; completed: boolean }>`
  width: ${({ active }) => (active ? 24 : 8)}px;
  height: 8px;
  border-radius: 4px;
  background-color: ${({ theme, active, completed }) =>
    active ? theme.colors.primary : completed ? theme.colors.primary : theme.colors.border};
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

const ConsentRow = styled.Pressable`
  min-height: 44px;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  padding-vertical: 6px;
`;

type LocationResult = {
  place_id: string;
  display_name: string;
  lat: string;
  lon: string;
};

const experienceOptions: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];
const irrigationOptions = ['rain-fed', 'drip', 'sprinkler', 'flood'] as const;

type RegistrationForm = {
  fullName: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  phoneNumber: string;
  farmName: string;
  farmLocation: string;
  farmLatitude: number | null;
  farmLongitude: number | null;
  farmSizeM2: string;
  soilType: string;
  irrigationAccess: string;
  crops: string;
  experienceLevel: ExperienceLevel;
  acceptedTerms: boolean;
  acceptedPrivacy: boolean;
  researchConsent: boolean;
};

const initialForm: RegistrationForm = {
  fullName: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  phoneNumber: '',
  farmName: '',
  farmLocation: '',
  farmLatitude: null,
  farmLongitude: null,
  farmSizeM2: '',
  soilType: '',
  irrigationAccess: 'drip',
  crops: '',
  experienceLevel: 'beginner',
  acceptedTerms: false,
  acceptedPrivacy: false,
  researchConsent: false,
};

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const toast = useToast();
  const setAuthState = useAppStore((s) => s.setAuthState);
  const setProfile = useAppStore((s) => s.setFarmerProfile);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const legalVersionsQuery = useQuery({
    queryKey: ['legalVersions'],
    queryFn: () => authApi.getLegalVersions(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
  const legalVersions = legalVersionsQuery.data;
  const legalVersionsConfirmed = Boolean(legalVersions?.termsVersion && legalVersions?.privacyVersion);

  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [gettingGPS, setGettingGPS] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<LeafletMapHandle | null>(null);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const updateForm = <K extends keyof RegistrationForm>(field: K, value: RegistrationForm[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const animateStep = useCallback(
    (newStep: number) => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }).start(() => {
        setStep(newStep);
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
      });
    },
    [fadeAnim],
  );

  const searchLocation = useCallback(
    (query: string) => {
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
          // silently fail
        } finally {
          setSearching(false);
        }
      }, 400);
    },
    [],
  );

  const selectLocation = useCallback(
    (item: LocationResult) => {
      const lat = parseFloat(item.lat);
      const lng = parseFloat(item.lon);
      updateForm('farmLocation', item.display_name);
      updateForm('farmLatitude', lat);
      updateForm('farmLongitude', lng);
      setLocationQuery(item.display_name);
      setLocationResults([]);
      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        600,
      );
    },
    [],
  );

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
      updateForm('farmLatitude', lat);
      updateForm('farmLongitude', lng);

      try {
        const res = await fetch(
          `https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_KEY}&lat=${lat}&lon=${lng}&format=json`,
        );
        const data = await res.json();
        if (data?.display_name) {
          updateForm('farmLocation', data.display_name);
          setLocationQuery(data.display_name);
        }
      } catch {
        updateForm('farmLocation', `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setLocationQuery(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }

      mapRef.current?.animateToRegion(
        { latitude: lat, longitude: lng, latitudeDelta: 0.01, longitudeDelta: 0.01 },
        600,
      );
    } catch (e: any) {
      toast.error('Location error', e.message || 'Could not get your location. Please try again.');
    } finally {
      setGettingGPS(false);
    }
  }, [toast]);

  const mutation = useMutation({
    mutationFn: () => {
      if (!legalVersionsConfirmed || !legalVersions) {
        throw new Error('Current legal terms could not be confirmed.');
      }
      const irrigationAccess = irrigationOptions.includes(form.irrigationAccess as any)
        ? (form.irrigationAccess as (typeof irrigationOptions)[number])
        : 'drip';
      const farmSizeParsed = form.farmSizeM2 ? Number(form.farmSizeM2) : undefined;
      const crops = form.crops
        ? form.crops.split(',').map((c) => c.trim()).filter(Boolean)
        : undefined;

      return authApi.register({
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        password: form.password,
        password_confirmation: form.passwordConfirmation,
        ...(form.phoneNumber ? { phoneNumber: form.phoneNumber } : {}),
        ...(form.farmName ? { farmName: form.farmName } : {}),
        ...(form.farmLocation ? { farmLocation: form.farmLocation } : {}),
        ...(form.farmLatitude != null ? { farmLatitude: form.farmLatitude } : {}),
        ...(form.farmLongitude != null ? { farmLongitude: form.farmLongitude } : {}),
        ...(typeof farmSizeParsed === 'number' && !Number.isNaN(farmSizeParsed) ? { farmSizeM2: farmSizeParsed } : {}),
        ...(form.soilType ? { soilType: form.soilType } : {}),
        ...(crops?.length ? { crops } : {}),
        ...(form.experienceLevel ? { experienceLevel: form.experienceLevel } : {}),
        ...(irrigationAccess ? { irrigationAccess } : {}),
        acceptedTerms: true,
        acceptedPrivacy: true,
        termsVersion: legalVersions.termsVersion,
        privacyVersion: legalVersions.privacyVersion,
        researchConsent: form.researchConsent,
      });
    },
    onMutate: () => setAuthState({ status: 'authenticating' }),
    onSuccess: async (response) => {
      clearAuthQueryCache();
      await clearAllSyncActions();
      await authStorage.saveToken(response.token);
      setAuthState({ status: 'authenticated', token: response.token });
      setProfile(response.profile);
      console.info('[auth] registration completed');
      toast.success('Account created', 'Welcome to AgroAide. Check your email for a welcome message.');
      if (!isFarmProfileComplete(response.profile)) {
        router.replace('/auth/complete-farm');
      } else {
        router.replace('/(app)/(tabs)/dashboard');
      }
    },
    onError: (error) => {
      clearAuthQueryCache();
      setAuthState({ status: 'signedOut' });
      const message = error instanceof ApiError ? error.message : 'Please review your details and try again.';
      toast.error('Registration failed', message);
    },
  });

  const canGoToStep2 = useMemo(() => {
    return Boolean(
      form.fullName && form.email && form.password && form.passwordConfirmation && form.password === form.passwordConfirmation,
    );
  }, [form.fullName, form.email, form.password, form.passwordConfirmation]);
  const canCreateAccount = form.acceptedTerms && form.acceptedPrivacy && legalVersionsConfirmed;

  const renderStepIndicator = () => (
    <StepRow>
      {[1, 2, 3].map((s) => (
        <StepDot key={s} active={step === s} completed={step > s} />
      ))}
    </StepRow>
  );

  const renderStep1 = () => (
    <Card rounded="xl">
      <InputField label="Full name" value={form.fullName} onChangeText={(t) => updateForm('fullName', t)} />
      <InputField
        label="Email address"
        value={form.email}
        onChangeText={(t) => updateForm('email', t)}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <InputField
        label="Phone number (optional)"
        value={form.phoneNumber}
        onChangeText={(t) => updateForm('phoneNumber', t)}
        keyboardType="phone-pad"
      />
      <InputField
        label="Password"
        value={form.password}
        onChangeText={(t) => updateForm('password', t)}
        secureTextEntry={!showPassword}
        rightElement={
          <Pressable
            onPress={() => setShowPassword((p) => !p)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            accessibilityState={{ expanded: showPassword }}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        }
      />
      <InputField
        label="Confirm password"
        value={form.passwordConfirmation}
        onChangeText={(t) => updateForm('passwordConfirmation', t)}
        secureTextEntry={!showConfirmPassword}
        rightElement={
          <Pressable
            onPress={() => setShowConfirmPassword((p) => !p)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
            accessibilityState={{ expanded: showConfirmPassword }}>
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        }
      />
      {form.passwordConfirmation && form.password !== form.passwordConfirmation ? (
        <Chip label="Passwords do not match" tone="danger" />
      ) : null}
      <Button label="Next" onPress={() => animateStep(2)} fullWidth disabled={!canGoToStep2} />
    </Card>
  );

  const renderStep2 = () => (
    <Card rounded="xl">
      <Text variant="headline" tone="muted">
        Tell us about your farm (optional)
      </Text>
      <InputField label="Farm name" value={form.farmName} onChangeText={(t) => updateForm('farmName', t)} />
      <InputField
        label="Farm size (m²)"
        value={form.farmSizeM2}
        onChangeText={(t) => updateForm('farmSizeM2', t)}
        keyboardType="decimal-pad"
      />
      {form.farmSizeM2 && formatSquareSidesFt(Number(form.farmSizeM2)) ? (
        <Text variant="caption" tone="muted">
          ≈ {formatSquareSidesFt(Number(form.farmSizeM2))} (square plot estimate)
        </Text>
      ) : null}
      <InputField label="Soil type" value={form.soilType} onChangeText={(t) => updateForm('soilType', t)} placeholder="e.g. Loamy, Clay, Sandy" />
      <Text variant="caption" tone="muted">
        Irrigation method
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {irrigationOptions.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            tone={form.irrigationAccess === opt ? 'success' : 'default'}
            onPress={() => updateForm('irrigationAccess', opt)}
          />
        ))}
      </View>
      <InputField
        label="Primary crops"
        value={form.crops}
        onChangeText={(t) => updateForm('crops', t)}
        placeholder="Maize, Rice, Cassava"
      />
      <Text variant="caption" tone="muted">
        Experience level
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {experienceOptions.map((opt) => (
          <Chip
            key={opt}
            label={opt}
            tone={form.experienceLevel === opt ? 'success' : 'default'}
            onPress={() => updateForm('experienceLevel', opt)}
          />
        ))}
      </View>
      <ButtonRow>
        <Button label="Back" variant="outline" onPress={() => animateStep(1)} style={{ flex: 1 }} />
        <Button label="Next" onPress={() => animateStep(3)} style={{ flex: 1 }} />
      </ButtonRow>
    </Card>
  );

  const renderStep3 = () => (
    <Card rounded="xl">
      <Text variant="headline" tone="muted">
        Farm location (optional)
      </Text>
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
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
        <Text variant="caption" tone="muted">or search</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: theme.colors.border }} />
      </View>
      <InputField
        label="Search for your farm"
        value={locationQuery}
        onChangeText={searchLocation}
        placeholder="Type an address or area..."
      />
      {searching && <ActivityIndicator size="small" color={theme.colors.primary} />}
      {locationResults.length > 0 && (
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
      )}

      {form.farmLatitude != null && form.farmLongitude != null && (
        <>
          <View style={{ height: 200, borderRadius: 16, overflow: 'hidden', marginTop: 8 }}>
            <LocationMapPreview
              ref={mapRef}
              latitude={form.farmLatitude}
              longitude={form.farmLongitude}
            />
          </View>
          <Chip label={form.farmLocation.substring(0, 60) + (form.farmLocation.length > 60 ? '...' : '')} tone="success" />
        </>
      )}

      <Surface variant="muted" rounded="lg" style={{ gap: 4 }}>
        {legalVersionsQuery.isLoading ? (
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
            accessibilityLiveRegion="polite">
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text variant="caption" tone="muted">Confirming the current terms and privacy notice…</Text>
          </View>
        ) : legalVersionsQuery.isError || !legalVersionsConfirmed ? (
          <Surface variant="transparent" style={{ gap: 8, paddingVertical: 8 }}>
            <Text variant="caption" tone="danger">
              We could not confirm the current legal documents. Check your connection, then try again.
            </Text>
            <Button
              label="Try again"
              variant="secondary"
              onPress={() => legalVersionsQuery.refetch()}
              loading={legalVersionsQuery.isFetching}
            />
          </Surface>
        ) : (
          <Text variant="caption" tone="muted" style={{ paddingVertical: 4 }}>
            Current terms and privacy notice confirmed.
          </Text>
        )}
        <ConsentRow
          onPress={() => updateForm('acceptedTerms', !form.acceptedTerms)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: form.acceptedTerms }}>
          <Ionicons name={form.acceptedTerms ? 'checkbox' : 'square-outline'} size={24} color={theme.colors.primary} />
          <Text variant="caption" style={{ flex: 1 }}>
            I accept the{' '}
            <Text variant="caption" tone="accent" onPress={() => router.push('/terms' as never)}>terms of use</Text>.
          </Text>
        </ConsentRow>
        <ConsentRow
          onPress={() => updateForm('acceptedPrivacy', !form.acceptedPrivacy)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: form.acceptedPrivacy }}>
          <Ionicons name={form.acceptedPrivacy ? 'checkbox' : 'square-outline'} size={24} color={theme.colors.primary} />
          <Text variant="caption" style={{ flex: 1 }}>
            I have read the{' '}
            <Text variant="caption" tone="accent" onPress={() => router.push('/privacy' as never)}>privacy notice</Text>.
          </Text>
        </ConsentRow>
        <ConsentRow
          onPress={() => updateForm('researchConsent', !form.researchConsent)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: form.researchConsent }}>
          <Ionicons name={form.researchConsent ? 'checkbox' : 'square-outline'} size={24} color={theme.colors.primary} />
          <Text variant="caption" style={{ flex: 1 }}>
            Optional: I consent to my de-identified app-use data being used for academic research.
          </Text>
        </ConsentRow>
      </Surface>

      <ButtonRow>
        <Button label="Back" variant="outline" onPress={() => animateStep(2)} style={{ flex: 1 }} />
        <Button
          label="Create account"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          disabled={!canCreateAccount}
          style={{ flex: 1 }}
        />
      </ButtonRow>
    </Card>
  );

  const stepTitles = ['Create your account', 'Farm details', 'Farm location'];
  const stepSubtitles = ['Join AgroAide', 'Tell us about your farm', 'Where is your farm?'];

  return (
    <Screen edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <Content>
          {renderStepIndicator()}
          <Text variant="eyebrow" tone="accent">
            {stepTitles[step - 1]}
          </Text>
          <Text variant="display">{stepSubtitles[step - 1]}</Text>

          <Animated.View style={{ opacity: fadeAnim }}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </Animated.View>

          <Surface variant="transparent" style={{ alignItems: 'center' }}>
            <Text variant="body" tone="muted">
              Already have an account?{' '}
              <Link href="/auth/login" asChild>
                <Text variant="body" tone="accent">
                  Sign in
                </Text>
              </Link>
            </Text>
          </Surface>
        </Content>
      </KeyboardAvoidingView>
    </Screen>
  );
}
