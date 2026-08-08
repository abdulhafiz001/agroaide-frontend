import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styled, { useTheme } from '@/design-system/styled';

import * as Location from 'expo-location';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ConfirmModal } from '@/components/ConfirmModal';
import { CropTagsInput } from '@/components/CropTagsInput';
import { useToast } from '@/components/Toast';
import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';
import { authApi } from '@/services/authApi';
import { ThemePreference } from '@/design-system/theme';
import { useAppStore, type NotificationPreferences } from '@/store/useAppStore';
import { ApiError } from '@/services/apiClient';
import { LANGUAGE_OPTIONS, type SupportedLanguage } from '@/i18n/translations';
import { useTranslation } from '@/i18n/useTranslation';
import { clearAuthQueryCache } from '@/utils/queryClient';
import { formatAreaWithFt, formatSquareSidesFt } from '@/utils/formatters';
import { countPendingSyncActions } from '@/services/syncEngine';
import { runAppSync } from '@/services/appSync';
import { clearAllSyncActions } from '@/services/syncQueue';
import { authStorage } from '@/utils/authStorage';



const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Content = styled.ScrollView.attrs(({ theme }) => ({
  keyboardShouldPersistTaps: 'handled' as const,
  contentContainerStyle: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl * 1.5,
    gap: theme.spacing.lg,
  },
}))``;

const Section = styled(Surface)`
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const SegmentedControl = styled.View`
  flex-direction: row;
  background-color: ${({ theme }) => `${theme.colors.surfaceAlt}aa`};
  border-radius: ${({ theme }) => theme.radii.pill}px;
  padding: 4px;
  gap: 4px;
`;

const SegmentButton = styled.TouchableOpacity<{ active: boolean }>`
  flex: 1;
  padding-vertical: 10px;
  border-radius: ${({ theme }) => theme.radii.pill}px;
  align-items: center;
  justify-content: center;
  background-color: ${({ active, theme }) => (active ? theme.colors.surface : 'transparent')};
  border-width: ${({ active }) => (active ? 0 : 1)}px;
  border-color: ${({ theme }) => `${theme.colors.border}80`};
`;

const notificationSettings: {
  key: keyof NotificationPreferences;
  labelKey:
    | 'criticalWeatherAlerts'
    | 'aiAgronomyTips'
    | 'plantingWindowAlerts'
    | 'fieldBoundaryReminders'
    | 'diseaseOutbreakAlerts';
  description: string;
  locked?: boolean;
}[] = [
  { key: 'severeWeather', labelKey: 'criticalWeatherAlerts', description: 'Storms, heat waves & frost advisories.' },
  { key: 'aiInsights', labelKey: 'aiAgronomyTips', description: 'Timely crop health nudges.' },
  {
    key: 'plantingWindowAlerts',
    labelKey: 'plantingWindowAlerts',
    description: 'Notify when it is time to plant watched crops in your zone.',
  },
  {
    key: 'fieldBoundaryReminders',
    labelKey: 'fieldBoundaryReminders',
    description: 'Remind you to walk field boundaries within 24 hours of adding a field.',
  },
  {
    key: 'diseaseOutbreak',
    labelKey: 'diseaseOutbreakAlerts',
    description: 'Community disease warnings near your farm. Always on for safety.',
    locked: true,
  },
];

const detailSegments = [
  { value: 'concise', label: 'Concise' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'deep', label: 'Deep dive' },
] as const;

const toneSegments = [
  { value: 'cautious', label: 'Cautious' },
  { value: 'balanced', label: 'Balanced' },
  { value: 'bold', label: 'Bold' },
] as const;

export default function ProfileScreen() {
  const toast = useToast();
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const profile = useAppStore((s) => s.farmerProfile);
  const themePreference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);
  const signOut = useAppStore((s) => s.signOut);
  const accessToken = useAppStore((s) => s.accessToken);
  const notificationPreferences = useAppStore((s) => s.notificationPreferences);
  const updateNotificationPreferences = useAppStore((s) => s.updateNotificationPreferences);
  const aiAdvisorPreference = useAppStore((s) => s.aiAdvisorPreference);
  const updateAiAdvisorPreference = useAppStore((s) => s.updateAiAdvisorPreference);
  const setProfile = useAppStore((s) => s.setFarmerProfile);
  const lastSyncISO = useAppStore((s) => s.lastSyncISO);
  const offlineModeEnabled = useAppStore((s) => s.offlineModeEnabled);
  const setOfflineMode = useAppStore((s) => s.setOfflineMode);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncingNow, setSyncingNow] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editFarmName, setEditFarmName] = useState('');
  const [editFarmLocation, setEditFarmLocation] = useState('');
  const [editFarmSize, setEditFarmSize] = useState('');
  const [editCrops, setEditCrops] = useState<string[]>([]);
  const [editSoilType, setEditSoilType] = useState('');

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showLegalSection, setShowLegalSection] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  const [editFarmLatitude, setEditFarmLatitude] = useState<number | null>(null);
  const [editFarmLongitude, setEditFarmLongitude] = useState<number | null>(null);
  const [editLocationResults, setEditLocationResults] = useState<any[]>([]);
  const locationSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchEditLocation = useCallback((text: string) => {
    setEditFarmLocation(text);
    setEditLocationResults([]);
    if (locationSearchTimer.current) clearTimeout(locationSearchTimer.current);
    if (text.length < 3) return;
    locationSearchTimer.current = setTimeout(async () => {
      try {
        const LOCATIONIQ_KEY = process.env.EXPO_PUBLIC_LOCATIONIQ_KEY;
        const res = await fetch(
          `https://us1.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(text)}&limit=5&format=json`,
        );
        const data = await res.json();
        if (Array.isArray(data)) setEditLocationResults(data);
      } catch {}
    }, 500);
  }, []);

  useEffect(() => {
    countPendingSyncActions().then(setPendingSyncCount).catch(() => setPendingSyncCount(0));
  }, [lastSyncISO]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.fullName);
      setEditEmail(profile.email);
      setEditPhone(profile.phoneNumber || '');
      setEditFarmName(profile.farmName || '');
      setEditFarmLocation(profile.farmLocation || '');
      setEditFarmSize(String(profile.farmSizeM2 || ''));
      setEditCrops(profile.crops?.length ? [...profile.crops] : []);
      setEditSoilType(profile.soilType || '');
    }
  }, [profile]);

  const meQuery = useQuery({
    queryKey: ['settingsMe'],
    queryFn: () => authApi.me(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (meQuery.data?.profile) setProfile(meQuery.data.profile);
  }, [meQuery.data?.profile, setProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: () => {
      const payload: any = {
        fullName: editName,
        email: editEmail,
        phoneNumber: editPhone || null,
        farmName: editFarmName || null,
        farmLocation: editFarmLocation || null,
        farmSizeM2: parseFloat(editFarmSize) || 0,
        crops: editCrops.length ? editCrops : undefined,
        soilType: editSoilType || null,
      };
      if (editFarmLatitude != null) payload.farmLatitude = editFarmLatitude;
      if (editFarmLongitude != null) payload.farmLongitude = editFarmLongitude;
      return authApi.updateProfile(accessToken ?? '', payload);
    },
    onSuccess: (res) => {
      setProfile(res.profile);
      setEditMode(false);
      queryClient.invalidateQueries({ queryKey: ['settingsMe'] });
      toast.success('Success', 'Profile updated successfully.');
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Could not update profile.';
      toast.error('Error', msg);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: () =>
      authApi.changePassword(accessToken ?? '', {
        currentPassword,
        newPassword,
        newPassword_confirmation: confirmNewPassword,
      }),
    onSuccess: () => {
      setCurrentPassword(''); setNewPassword(''); setConfirmNewPassword('');
      setShowPasswordSection(false);
      toast.success('Success', 'Password changed successfully.');
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Could not change password.';
      toast.error('Error', msg);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => { if (accessToken) await authApi.logout(accessToken); },
    onSettled: async () => {
      await Promise.all([
        authStorage.clearToken().catch(() => {}),
        clearAllSyncActions().catch(() => {}),
      ]);
      clearAuthQueryCache();
      signOut();
      console.info('[auth] signed out');
      router.replace('/auth/login');
    },
  });

  const exportAccountMutation = useMutation({
    mutationFn: async () => {
      console.info('[export] requesting account data');
      const result = await authApi.exportAccountData(accessToken ?? '');
      console.info('[export] response received', {
        hasContent: Boolean(result.content),
      });

      if (!result.content) {
        throw new Error('No export content was returned.');
      }

      const safeFilename = (result.filename || `agroaide-export-${Date.now()}.json`).replace(/[^a-z0-9._-]/gi, '-');

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const objectUrl = URL.createObjectURL(new Blob([result.content], { type: 'application/json' }));
        try {
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = safeFilename;
          link.click();
          console.info('[export] browser download started', { filename: safeFilename });
          return safeFilename;
        } finally {
          URL.revokeObjectURL(objectUrl);
        }
      }

      const baseDirectory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      if (baseDirectory) {
        try {
          const fileUri = `${baseDirectory}${safeFilename}`;
          console.info('[export] writing export to cache', { filename: safeFilename });
          await FileSystem.writeAsStringAsync(fileUri, result.content, {
            encoding: FileSystem.EncodingType.UTF8,
          });
          console.info('[export] export cached');
          if (await Sharing.isAvailableAsync()) {
            console.info('[export] opening share sheet');
            await Sharing.shareAsync(fileUri, {
              mimeType: 'application/json',
              dialogTitle: 'Share your AgroAide data',
            });
            console.info('[export] share sheet completed');
            return safeFilename;
          }
          console.info('[export] sharing unavailable; export kept on device', { filename: safeFilename });
          return safeFilename;
        } catch (error) {
          console.info('[export] inline export could not be shared', {
            message: error instanceof Error ? error.message : 'unknown error',
          });
        }
      }

      throw new Error('No writable export location is available.');
    },
    onSuccess: (filename) => toast.success('Export ready', `${filename} is ready to save or share.`),
    onError: () => toast.error('Export failed', 'We could not prepare your data. Please try again.'),
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => authApi.deleteAccount(accessToken ?? '', deletePassword),
    onSuccess: async () => {
      await Promise.all([
        authStorage.clearToken(),
        clearAllSyncActions(),
      ]);
      clearAuthQueryCache();
      signOut();
      console.info('[auth] account deleted; local session cleared');
      setShowDeleteDialog(false);
      router.replace('/auth/login');
    },
    onError: () => toast.error('Could not delete account', 'Check your password and try again.'),
  });

  const { t } = useTranslation();
  const currentLanguage = (profile?.preferredLanguage ?? 'en') as SupportedLanguage;

  const handleLanguageChange = useCallback(async (langCode: SupportedLanguage) => {
    if (!accessToken) return;
    try {
      const res = await authApi.updateProfile(accessToken, { preferredLanguage: langCode });
      setProfile(res.profile);
      // Drop cached AI insights so the next load uses the new language.
      queryClient.invalidateQueries({ queryKey: ['dashboardAiInsights'] });
      queryClient.invalidateQueries({ queryKey: ['advisorSuggestions'] });
      queryClient.invalidateQueries({ queryKey: ['advisorHistory'] });
    } catch {
      toast.error('Error', 'Could not update language preference.');
    }
  }, [accessToken, queryClient, setProfile, toast]);

  const handleGPSLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.error('Permission denied', 'Allow location access to use this feature.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      setEditFarmLatitude(lat);
      setEditFarmLongitude(lng);
      const LOCATIONIQ_KEY = process.env.EXPO_PUBLIC_LOCATIONIQ_KEY;
      try {
        const res = await fetch(`https://us1.locationiq.com/v1/reverse?key=${LOCATIONIQ_KEY}&lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        if (data?.display_name) setEditFarmLocation(data.display_name);
      } catch {
        setEditFarmLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      }
    } catch (e: any) {
      toast.error('Location error', e.message || 'Could not get location.');
    }
  }, [toast]);

  const initials = profile?.fullName?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Screen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
      <Content>
        <View
          style={{ borderRadius: 32, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: theme.colors.primary }}>
          <Surface
            variant="transparent"
            style={{
              width: 68, height: 68, borderRadius: 34, borderWidth: 1, borderColor: '#ffffff44',
              alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff22',
            }}>
            <Text variant="title" tone="inverse">{initials ?? 'AG'}</Text>
          </Surface>
          <View style={{ flex: 1 }}>
            <Text variant="eyebrow" tone="inverse">Farmer profile</Text>
            <Text variant="title" tone="inverse">{profile?.fullName ?? 'Farmer'}</Text>
            <Text variant="body" tone="inverse">{profile?.farmName ?? 'Your farm'}, {profile?.farmLocation ?? 'Nigeria'}</Text>
          </View>
        </View>

        {/* Personal Details - Edit Section */}
        <Section rounded="xl">
          <Row>
            <Text variant="headline">Personal details</Text>
            <Chip label={editMode ? 'Cancel' : 'Edit'} tone={editMode ? 'danger' : 'success'} onPress={() => setEditMode(!editMode)} />
          </Row>
          {editMode ? (
            <View style={{ gap: 12 }}>
              <InputField label="Full name" value={editName} onChangeText={setEditName} />
              <InputField label="Email" value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" autoCapitalize="none" />
              <InputField label="Phone number" value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />
              <InputField label="Farm name" value={editFarmName} onChangeText={setEditFarmName} />
              <InputField label="Farm location" value={editFarmLocation} onChangeText={searchEditLocation} placeholder="Search for a location..." />
              <TouchableOpacity
                onPress={handleGPSLocation}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: theme.colors.primary,
                  alignSelf: 'flex-start',
                }}
              >
                <Ionicons name="locate" size={16} color={theme.colors.primary} />
                <Text variant="caption" style={{ color: theme.colors.primary, fontWeight: '600' }}>{t('useMyLocation')}</Text>
              </TouchableOpacity>
              {editLocationResults.length > 0 && (
                <Surface variant="muted" style={{ maxHeight: 150, borderRadius: 12, overflow: 'hidden' }}>
                  {editLocationResults.map((item: any) => (
                    <TouchableOpacity
                      key={item.place_id}
                      onPress={() => {
                        setEditFarmLocation(item.display_name);
                        setEditFarmLatitude(parseFloat(item.lat));
                        setEditFarmLongitude(parseFloat(item.lon));
                        setEditLocationResults([]);
                      }}
                      style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}
                    >
                      <Text variant="body" numberOfLines={2}>{item.display_name}</Text>
                    </TouchableOpacity>
                  ))}
                </Surface>
              )}
              <InputField label="Farm size (m²)" value={editFarmSize} onChangeText={setEditFarmSize} keyboardType="decimal-pad" />
              {editFarmSize && formatSquareSidesFt(Number(editFarmSize)) ? (
                <Text variant="caption" tone="muted">
                  ≈ {formatSquareSidesFt(Number(editFarmSize))} (square plot estimate)
                </Text>
              ) : null}
              <CropTagsInput value={editCrops} onChange={setEditCrops} placeholder="e.g. Maize," />
              <InputField label="Soil type" value={editSoilType} onChangeText={setEditSoilType} />
              <Button
                label="Save changes"
                onPress={() => updateProfileMutation.mutate()}
                loading={updateProfileMutation.isPending}
                fullWidth
              />
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              <Row>
                <Text variant="caption" tone="muted">Name</Text>
                <Text variant="body">{profile?.fullName}</Text>
              </Row>
              <Row>
                <Text variant="caption" tone="muted">Email</Text>
                <Text variant="body">{profile?.email}</Text>
              </Row>
              <Row>
                <Text variant="caption" tone="muted">Phone</Text>
                <Text variant="body">{profile?.phoneNumber || 'Not set'}</Text>
              </Row>
              <Row>
                <Text variant="caption" tone="muted">Farm</Text>
                <Text variant="body">{profile?.farmName || 'Not set'}</Text>
              </Row>
              <Row>
                <Text variant="caption" tone="muted">Location</Text>
                <Text variant="body" style={{ flex: 1, textAlign: 'right' }} numberOfLines={1}>{profile?.farmLocation || 'Not set'}</Text>
              </Row>
              <Row>
                <Text variant="caption" tone="muted">Size</Text>
                <Text variant="body">{formatAreaWithFt(profile?.farmSizeM2)}</Text>
              </Row>
              <Row>
                <Text variant="caption" tone="muted">Crops</Text>
                <Text variant="body">{profile?.crops?.join(', ') || 'Not set'}</Text>
              </Row>
              <Row>
                <Text variant="caption" tone="muted">Soil</Text>
                <Text variant="body">{profile?.soilType || 'Not set'}</Text>
              </Row>
            </View>
          )}
        </Section>

        {/* Change Password Section */}
        <Section rounded="xl">
          <Row>
            <Text variant="headline">Change password</Text>
            <Chip
              label={showPasswordSection ? 'Close' : 'Change'}
              tone={showPasswordSection ? 'danger' : 'info'}
              onPress={() => setShowPasswordSection(!showPasswordSection)}
            />
          </Row>
          {showPasswordSection && (
            <View style={{ gap: 12 }}>
              <InputField label="Current password" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
              <InputField label="New password" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
              <InputField label="Confirm new password" value={confirmNewPassword} onChangeText={setConfirmNewPassword} secureTextEntry />
              {newPassword && confirmNewPassword && newPassword !== confirmNewPassword && (
                <Text variant="caption" style={{ color: '#e63946' }}>Passwords do not match</Text>
              )}
              <Button
                label="Change password"
                variant="secondary"
                onPress={() => changePasswordMutation.mutate()}
                loading={changePasswordMutation.isPending}
                disabled={!currentPassword || !newPassword || newPassword !== confirmNewPassword || newPassword.length < 8}
                fullWidth
              />
            </View>
          )}
        </Section>

        {/* Language */}
        <Section rounded="xl">
          <Text variant="headline">{t('language')}</Text>
          <Text variant="caption" tone="muted">{t('selectLanguage')}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {LANGUAGE_OPTIONS.map((lang) => (
              <Chip
                key={lang.code}
                label={`${lang.nativeLabel} (${lang.label})`}
                tone={currentLanguage === lang.code ? 'success' : 'default'}
                onPress={() => handleLanguageChange(lang.code)}
              />
            ))}
          </View>
        </Section>

        {/* Display & Modes */}
        <Section rounded="xl">
          <Text variant="headline">Display & modes</Text>
          <SegmentedControl>
            {(['system', 'light', 'dark', 'field'] as ThemePreference[]).map((mode) => (
              <SegmentButton
                key={mode}
                active={themePreference === mode}
                onPress={() => setThemePreference(mode)}
                accessibilityRole="radio"
                accessibilityLabel={`${mode} display mode`}
                accessibilityState={{ selected: themePreference === mode }}>
                <Text variant="caption" tone={themePreference === mode ? 'default' : 'muted'}>
                  {mode === 'field' ? 'Field' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </SegmentButton>
            ))}
          </SegmentedControl>
        </Section>

        <Section rounded="xl">
          <Row>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text variant="headline">{t('offlineSync')}</Text>
              <Text variant="caption" tone="muted">
                {t('offlineSyncHint')}
              </Text>
            </View>
            <Switch
              value={offlineModeEnabled}
              onValueChange={setOfflineMode}
              accessibilityRole="switch"
              accessibilityLabel={t('offlineSync')}
              accessibilityState={{ checked: offlineModeEnabled }}
            />
          </Row>
          <Text variant="body">{t('pendingActions')}: {pendingSyncCount}</Text>
          <Text variant="caption" tone="muted">
            {lastSyncISO ? `Last synced ${new Date(lastSyncISO).toLocaleString()}` : 'Not synced yet'}
          </Text>
          <Button
            label={t('syncNow')}
            variant="secondary"
            loading={syncingNow}
            fullWidth
            onPress={async () => {
              if (!accessToken) return;
              setSyncingNow(true);
              try {
                await runAppSync(accessToken);
                setPendingSyncCount(await countPendingSyncActions());
                toast.success('Synced', 'Offline queue drained.');
              } catch {
                toast.error('Sync failed', 'Could not reach the server.');
              } finally {
                setSyncingNow(false);
              }
            }}
          />
        </Section>

        {/* Notifications */}
        <Section rounded="xl">
          <Text variant="headline">{t('notifications')}</Text>
          {notificationSettings.map((setting) => (
            <View key={setting.key} style={{ paddingVertical: 6 }}>
              <Row>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text variant="body">{t(setting.labelKey)}</Text>
                  <Text variant="caption" tone="muted">{setting.description}</Text>
                </View>
                <Switch
                  value={setting.locked ? true : Boolean(notificationPreferences[setting.key])}
                  disabled={setting.locked}
                  accessibilityRole="switch"
                  accessibilityLabel={t(setting.labelKey)}
                  accessibilityState={{
                    checked: setting.locked ? true : Boolean(notificationPreferences[setting.key]),
                    disabled: Boolean(setting.locked),
                  }}
                  onValueChange={(v) => {
                    if (setting.locked) return;
                    updateNotificationPreferences({ [setting.key]: v });
                    if (accessToken) {
                      authApi
                        .updateProfile(accessToken, {
                          notificationPreferences: { ...notificationPreferences, [setting.key]: v },
                        })
                        .catch(() => {});
                    }
                  }}
                />
              </Row>
            </View>
          ))}
        </Section>

        {/* AI Advisor Tuning */}
        <Section rounded="xl">
          <Text variant="headline">{t('aiAdvisorTuning')}</Text>
          <View>
            <Text variant="caption" tone="muted">{t('detailLevel')}</Text>
            <SegmentedControl>
              {detailSegments.map((s) => (
                <SegmentButton
                  key={s.value}
                  active={aiAdvisorPreference.detailLevel === s.value}
                  onPress={() => {
                    updateAiAdvisorPreference({ detailLevel: s.value });
                    authApi.updateProfile(accessToken ?? '', { aiDetailLevel: s.value }).catch(() => {});
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={s.label}
                  accessibilityState={{ selected: aiAdvisorPreference.detailLevel === s.value }}>
                  <Text variant="caption" tone={aiAdvisorPreference.detailLevel === s.value ? 'default' : 'muted'}>{s.label}</Text>
                </SegmentButton>
              ))}
            </SegmentedControl>
          </View>
          <View>
            <Text variant="caption" tone="muted">{t('advisoryTone')}</Text>
            <SegmentedControl>
              {toneSegments.map((s) => (
                <SegmentButton
                  key={s.value}
                  active={aiAdvisorPreference.tone === s.value}
                  onPress={() => {
                    updateAiAdvisorPreference({ tone: s.value });
                    authApi.updateProfile(accessToken ?? '', { aiTone: s.value }).catch(() => {});
                  }}
                  accessibilityRole="radio"
                  accessibilityLabel={s.label}
                  accessibilityState={{ selected: aiAdvisorPreference.tone === s.value }}>
                  <Text variant="caption" tone={aiAdvisorPreference.tone === s.value ? 'default' : 'muted'}>{s.label}</Text>
                </SegmentButton>
              ))}
            </SegmentedControl>
          </View>
        </Section>

        <Section rounded="xl">
          <Row>
            <Text variant="headline">{t('legalAndYourData')}</Text>
            <Chip
              label={showLegalSection ? 'Close' : 'Open'}
              tone={showLegalSection ? 'danger' : 'info'}
              onPress={() => setShowLegalSection(!showLegalSection)}
            />
          </Row>
          {showLegalSection ? (
            <View style={{ gap: 12 }}>
              <Button label={t('privacyNotice')} variant="secondary" onPress={() => router.push('/privacy' as never)} fullWidth />
              <Button label={t('termsOfUse')} variant="secondary" onPress={() => router.push('/terms' as never)} fullWidth />
              <Button
                label={t('exportMyData')}
                variant="secondary"
                loading={exportAccountMutation.isPending}
                onPress={() => exportAccountMutation.mutate()}
                fullWidth
              />
              <Surface
                rounded="lg"
                style={{ gap: 8, borderWidth: 1, borderColor: theme.colors.danger, backgroundColor: `${theme.colors.danger}0D` }}>
                <Text variant="headline" tone="danger">Danger zone</Text>
                <Text variant="caption" tone="muted">
                  Keep your account unless you are completely sure. Deleting it permanently removes your farm records, scans, and account data.
                </Text>
                <Button
                  label="Delete account permanently"
                  onPress={() => setShowDeleteDialog(true)}
                  style={{ backgroundColor: theme.colors.danger }}
                  fullWidth
                />
              </Surface>
            </View>
          ) : null}
        </Section>

        <Button
          label="Sign out"
          variant="ghost"
          onPress={() => logoutMutation.mutate()}
          loading={logoutMutation.isPending}
          disabled={logoutMutation.isPending}
        />
      </Content>
      </KeyboardAvoidingView>
      <ConfirmModal
        visible={showDeleteDialog}
        title="Delete your account permanently?"
        message="This cannot be undone. You will lose your farm records, scans, history, and access to this account. We strongly recommend keeping your account."
        confirmLabel="Delete permanently"
        loading={deleteAccountMutation.isPending}
        confirmDisabled={!deletePassword}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeletePassword('');
        }}
        onConfirm={() => deleteAccountMutation.mutate()}>
        <Surface
          rounded="lg"
          style={{ gap: 8, borderWidth: 1, borderColor: theme.colors.danger, backgroundColor: `${theme.colors.danger}0D` }}>
          <Text variant="body" tone="danger">Danger: permanent account deletion</Text>
          <InputField
            label="Enter your password to continue"
            value={deletePassword}
            onChangeText={setDeletePassword}
            secureTextEntry
            autoComplete="current-password"
          />
        </Surface>
      </ConfirmModal>
    </Screen>
  );
}
