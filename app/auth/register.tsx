import { useMutation } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import styled from '@/design-system/styled';
import { useTheme } from 'styled-components/native';

import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';
import { ApiError } from '@/services/apiClient';
import { authApi } from '@/services/authApi';
import { useAppStore } from '@/store/useAppStore';
import type { ExperienceLevel } from '@/types/farmer';

const LOCATIONIQ_KEY = process.env.EXPO_PUBLIC_LOCATIONIQ_KEY || '';

const Container = styled.SafeAreaView`
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
  farmSizeHectares: string;
  soilType: string;
  irrigationAccess: string;
  crops: string;
  experienceLevel: ExperienceLevel;
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
  farmSizeHectares: '',
  soilType: '',
  irrigationAccess: 'drip',
  crops: '',
  experienceLevel: 'beginner',
};

const TOTAL_STEPS = 3;

export default function RegisterScreen() {
  const router = useRouter();
  const theme = useTheme();
  const setAuthState = useAppStore((s) => s.setAuthState);
  const setProfile = useAppStore((s) => s.setFarmerProfile);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [showPassword, setShowPassword] = useState(false);

  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mapRef = useRef<MapView>(null);

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

  const mutation = useMutation({
    mutationFn: () => {
      const irrigationAccess = irrigationOptions.includes(form.irrigationAccess as any)
        ? (form.irrigationAccess as (typeof irrigationOptions)[number])
        : 'drip';
      const farmSizeParsed = form.farmSizeHectares ? Number(form.farmSizeHectares) : undefined;
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
        ...(typeof farmSizeParsed === 'number' && !Number.isNaN(farmSizeParsed) ? { farmSizeHectares: farmSizeParsed } : {}),
        ...(form.soilType ? { soilType: form.soilType } : {}),
        ...(crops?.length ? { crops } : {}),
        ...(form.experienceLevel ? { experienceLevel: form.experienceLevel } : {}),
        ...(irrigationAccess ? { irrigationAccess } : {}),
      });
    },
    onMutate: () => setAuthState({ status: 'authenticating' }),
    onSuccess: (response) => {
      setAuthState({ status: 'authenticated', token: response.token });
      setProfile(response.profile);
      router.replace('/auth/profile');
    },
    onError: (error) => {
      setAuthState({ status: 'signedOut' });
      const message = error instanceof ApiError ? error.message : 'Please review your details and try again.';
      Alert.alert('Registration failed', message);
    },
  });

  const canGoToStep2 = useMemo(() => {
    return Boolean(
      form.fullName && form.email && form.password && form.passwordConfirmation && form.password === form.passwordConfirmation,
    );
  }, [form.fullName, form.email, form.password, form.passwordConfirmation]);

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
      />
      <InputField
        label="Confirm password"
        value={form.passwordConfirmation}
        onChangeText={(t) => updateForm('passwordConfirmation', t)}
        secureTextEntry={!showPassword}
      />
      <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
        <Chip
          label={showPassword ? 'Hide password' : 'Show password'}
          tone={showPassword ? 'success' : 'default'}
          onPress={() => setShowPassword((p) => !p)}
        />
        {form.passwordConfirmation && form.password !== form.passwordConfirmation ? (
          <Chip label="Passwords do not match" tone="danger" />
        ) : null}
      </View>
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
        label="Farm size (hectares)"
        value={form.farmSizeHectares}
        onChangeText={(t) => updateForm('farmSizeHectares', t)}
        keyboardType="decimal-pad"
      />
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
            <MapView
              ref={mapRef}
              style={{ flex: 1 }}
              initialRegion={{
                latitude: form.farmLatitude,
                longitude: form.farmLongitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{ latitude: form.farmLatitude, longitude: form.farmLongitude }}
                title="Farm location"
              />
            </MapView>
          </View>
          <Chip label={form.farmLocation.substring(0, 60) + (form.farmLocation.length > 60 ? '...' : '')} tone="success" />
        </>
      )}

      <ButtonRow>
        <Button label="Back" variant="outline" onPress={() => animateStep(2)} style={{ flex: 1 }} />
        <Button
          label="Create account"
          onPress={() => mutation.mutate()}
          loading={mutation.isPending}
          style={{ flex: 1 }}
        />
      </ButtonRow>
    </Card>
  );

  const stepTitles = ['Create your account', 'Farm details', 'Farm location'];
  const stepSubtitles = ['Join AgroAide', 'Tell us about your farm', 'Where is your farm?'];

  return (
    <Container>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
    </Container>
  );
}
