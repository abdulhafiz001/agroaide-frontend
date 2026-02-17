import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Switch, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';

import { Button, Chip, InputField, Surface, Text } from '@/design-system/components';
import { authApi } from '@/services/authApi';
import { systemApi } from '@/services/systemApi';
import { ThemePreference } from '@/design-system/theme';
import { useAppStore, type NotificationPreferences } from '@/store/useAppStore';
import { ApiError } from '@/services/apiClient';

import styled from '@/design-system/styled';

const Screen = styled(SafeAreaView)`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Content = styled.ScrollView.attrs(({ theme }) => ({
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

const ActionRow = styled(TouchableOpacity)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding-vertical: 12px;
`;

const notificationSettings: {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}[] = [
  { key: 'severeWeather', label: 'Critical weather alerts', description: 'Storms, heat waves & frost advisories.' },
  { key: 'marketMovers', label: 'Market intelligence', description: 'Commodity spikes & best selling days.' },
  { key: 'aiInsights', label: 'AI agronomy tips', description: 'Timely crop health nudges.' },
  { key: 'communityMentions', label: 'Community updates', description: 'Nearby farmers, forum replies.' },
] as const;

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
  const router = useRouter();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const profile = useAppStore((s) => s.farmerProfile);
  const themePreference = useAppStore((s) => s.themePreference);
  const setThemePreference = useAppStore((s) => s.setThemePreference);
  const signOut = useAppStore((s) => s.signOut);
  const accessToken = useAppStore((s) => s.accessToken);
  const offlineModeEnabled = useAppStore((s) => s.offlineModeEnabled);
  const setOfflineMode = useAppStore((s) => s.setOfflineMode);
  const lastSyncISO = useAppStore((s) => s.lastSyncISO);
  const setLastSync = useAppStore((s) => s.setLastSync);
  const notificationPreferences = useAppStore((s) => s.notificationPreferences);
  const updateNotificationPreferences = useAppStore((s) => s.updateNotificationPreferences);
  const aiAdvisorPreference = useAppStore((s) => s.aiAdvisorPreference);
  const updateAiAdvisorPreference = useAppStore((s) => s.updateAiAdvisorPreference);
  const setProfile = useAppStore((s) => s.setFarmerProfile);

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editFarmName, setEditFarmName] = useState('');
  const [editFarmLocation, setEditFarmLocation] = useState('');
  const [editFarmSize, setEditFarmSize] = useState('');
  const [editCrops, setEditCrops] = useState('');
  const [editSoilType, setEditSoilType] = useState('');

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

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
    if (profile) {
      setEditName(profile.fullName);
      setEditEmail(profile.email);
      setEditPhone(profile.phoneNumber || '');
      setEditFarmName(profile.farmName || '');
      setEditFarmLocation(profile.farmLocation || '');
      setEditFarmSize(String(profile.farmSizeHectares || ''));
      setEditCrops(profile.crops?.join(', ') || '');
      setEditSoilType(profile.soilType || '');
    }
  }, [profile]);

  const meQuery = useQuery({
    queryKey: ['settingsMe'],
    queryFn: () => authApi.me(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });

  const supportLinksQuery = useQuery({
    queryKey: ['supportLinks'],
    queryFn: () => systemApi.getSupportLinks(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });

  useEffect(() => {
    if (meQuery.data?.profile) setProfile(meQuery.data.profile);
  }, [meQuery.data?.profile, setProfile]);

  const updateProfileMutation = useMutation({
    mutationFn: () => {
      const crops = editCrops ? editCrops.split(',').map((c) => c.trim()).filter(Boolean) : undefined;
      const payload: any = {
        fullName: editName,
        email: editEmail,
        phoneNumber: editPhone || null,
        farmName: editFarmName || null,
        farmLocation: editFarmLocation || null,
        farmSizeHectares: parseFloat(editFarmSize) || 0,
        crops,
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
      Alert.alert('Success', 'Profile updated successfully.');
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Could not update profile.';
      Alert.alert('Error', msg);
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
      Alert.alert('Success', 'Password changed successfully.');
    },
    onError: (err) => {
      const msg = err instanceof ApiError ? err.message : 'Could not change password.';
      Alert.alert('Error', msg);
    },
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) return null;
      return systemApi.syncOfflineBrief(accessToken);
    },
    onSuccess: (response) => {
      setLastSync(response?.syncedAt ?? new Date().toISOString());
      Alert.alert('Synced', response?.message ?? 'Offline brief synced.');
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      if (!accessToken) return null;
      return systemApi.requestExport(accessToken);
    },
    onSuccess: (response) => {
      Alert.alert('Export', response?.message ?? 'Export scheduled.');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => { if (accessToken) await authApi.logout(accessToken); },
    onSettled: () => { signOut(); router.replace('/auth/login'); },
  });

  const initials = profile?.fullName?.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <Screen>
      <Content>
        <LinearGradient
          colors={['#57b346', '#2c5c2a']}
          style={{ borderRadius: 32, padding: 24, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
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
        </LinearGradient>

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
              <InputField label="Farm size (ha)" value={editFarmSize} onChangeText={setEditFarmSize} keyboardType="decimal-pad" />
              <InputField label="Crops (comma separated)" value={editCrops} onChangeText={setEditCrops} placeholder="Maize, Rice, Cassava" />
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
                <Text variant="body">{profile?.farmSizeHectares || 0} ha</Text>
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

        {/* Display & Modes */}
        <Section rounded="xl">
          <Text variant="headline">Display & modes</Text>
          <SegmentedControl>
            {(['system', 'light', 'dark', 'field'] as ThemePreference[]).map((mode) => (
              <SegmentButton key={mode} active={themePreference === mode} onPress={() => setThemePreference(mode)}>
                <Text variant="caption" tone={themePreference === mode ? 'default' : 'muted'}>
                  {mode === 'field' ? 'Field' : mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </SegmentButton>
            ))}
          </SegmentedControl>
        </Section>

        {/* Notifications */}
        <Section rounded="xl">
          <Text variant="headline">Notifications</Text>
          {notificationSettings.map((setting) => (
            <View key={setting.key} style={{ paddingVertical: 6 }}>
              <Row>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text variant="body">{setting.label}</Text>
                  <Text variant="caption" tone="muted">{setting.description}</Text>
                </View>
                <Switch value={notificationPreferences[setting.key]} onValueChange={(v) => updateNotificationPreferences({ [setting.key]: v })} />
              </Row>
            </View>
          ))}
        </Section>

        {/* AI Advisor Tuning */}
        <Section rounded="xl">
          <Text variant="headline">AI advisor tuning</Text>
          <View>
            <Text variant="caption" tone="muted">Detail level</Text>
            <SegmentedControl>
              {detailSegments.map((s) => (
                <SegmentButton key={s.value} active={aiAdvisorPreference.detailLevel === s.value} onPress={() => updateAiAdvisorPreference({ detailLevel: s.value })}>
                  <Text variant="caption" tone={aiAdvisorPreference.detailLevel === s.value ? 'default' : 'muted'}>{s.label}</Text>
                </SegmentButton>
              ))}
            </SegmentedControl>
          </View>
          <View>
            <Text variant="caption" tone="muted">Advisory tone</Text>
            <SegmentedControl>
              {toneSegments.map((s) => (
                <SegmentButton key={s.value} active={aiAdvisorPreference.tone === s.value} onPress={() => updateAiAdvisorPreference({ tone: s.value })}>
                  <Text variant="caption" tone={aiAdvisorPreference.tone === s.value ? 'default' : 'muted'}>{s.label}</Text>
                </SegmentButton>
              ))}
            </SegmentedControl>
          </View>
          <Row>
            <View>
              <Text variant="body">Voice tips</Text>
              <Text variant="caption" tone="muted">Read out AI insights during fieldwork.</Text>
            </View>
            <Switch value={aiAdvisorPreference.voiceTips} onValueChange={(v) => updateAiAdvisorPreference({ voiceTips: v })} />
          </Row>
        </Section>

        {/* Offline & Data */}
        <Section rounded="xl">
          <Text variant="headline">Offline & data</Text>
          <Row>
            <View>
              <Text variant="body">Offline brief</Text>
              <Text variant="caption" tone="muted">
                Cached data. {lastSyncISO ? `Last sync ${new Date(lastSyncISO).toLocaleDateString()}` : 'Not synced'}
              </Text>
            </View>
            <Switch value={offlineModeEnabled} onValueChange={(v) => { setOfflineMode(v); if (v) syncMutation.mutate(); }} />
          </Row>
          <Button label="Sync now" variant="secondary" fullWidth onPress={() => syncMutation.mutate()} loading={syncMutation.isPending} />
          <Button label="Export farm data" variant="ghost" onPress={() => exportMutation.mutate()} loading={exportMutation.isPending} />
        </Section>

        {/* Support */}
        <Section rounded="xl">
          <Text variant="headline">Support & learning</Text>
          <ActionRow onPress={() => Alert.alert('Learning center', supportLinksQuery.data?.links?.find((l: any) => l.id === 'help')?.message ?? 'Opening tutorials...')}>
            <Text variant="body">Help & tutorials</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </ActionRow>
          <ActionRow onPress={() => Alert.alert('Extension officer', supportLinksQuery.data?.links?.find((l: any) => l.id === 'extension')?.message ?? 'Connecting...')}>
            <Text variant="body">Contact extension officer</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </ActionRow>
          <ActionRow onPress={() => Alert.alert('Support', supportLinksQuery.data?.links?.find((l: any) => l.id === 'email')?.message ?? 'Email: support@agroaide.ng')}>
            <Text variant="body">Email support</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
          </ActionRow>
        </Section>

        <Button
          label="Sign out"
          variant="ghost"
          onPress={() => logoutMutation.mutate()}
          loading={logoutMutation.isPending}
          disabled={logoutMutation.isPending}
        />
      </Content>
    </Screen>
  );
}
