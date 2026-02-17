import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Switch, View } from 'react-native';
import styled from '@/design-system/styled';

import { Button, Chip, Surface, Text } from '@/design-system/components';
import type { ThemePreference } from '@/design-system/theme';
import { useThemeController } from '@/design-system/DesignSystemProvider';
import { authApi } from '@/services/authApi';
import { useAppStore } from '@/store/useAppStore';

const Container = styled.SafeAreaView`
  flex: 1;
  background-color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.lg}px ${({ theme }) => theme.spacing.md}px;
`;

const Section = styled(Surface)`
  margin-bottom: ${({ theme }) => theme.spacing.lg}px;
  gap: ${({ theme }) => theme.spacing.sm}px;
`;

const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const themeOptions: ThemePreference[] = ['light', 'dark', 'field'];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const profile = useAppStore((state) => state.farmerProfile);
  const accessToken = useAppStore((state) => state.accessToken);
  const setThemePreference = useAppStore((state) => state.setThemePreference);
  const offlineModeEnabled = useAppStore((state) => state.offlineModeEnabled);
  const setOfflineMode = useAppStore((state) => state.setOfflineMode);
  const lastSyncISO = useAppStore((state) => state.lastSyncISO);
  const setLastSync = useAppStore((state) => state.setLastSync);
  const setProfile = useAppStore((state) => state.setFarmerProfile);
  const { preference } = useThemeController();
  const meQuery = useQuery({
    queryKey: ['profileSetupMe'],
    queryFn: () => authApi.me(accessToken ?? ''),
    enabled: Boolean(accessToken),
  });
  useEffect(() => {
    if (meQuery.data?.profile) {
      setProfile(meQuery.data.profile);
    }
  }, [meQuery.data?.profile, setProfile]);

  if (!profile) {
    return null;
  }

  return (
    <Container>
      <Text variant="eyebrow" tone="accent">
        Final step
      </Text>
      <Text variant="display">Tailor AgroAide to your field</Text>
      <Section rounded="xl">
        <Text variant="headline">Theme preference</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {themeOptions.map((option) => (
            <Chip
              key={option}
              label={option === 'field' ? 'Field mode' : `${option} mode`}
              tone={preference === option ? 'success' : 'default'}
              onPress={() => setThemePreference(option)}
            />
          ))}
        </View>
      </Section>
      <Section rounded="xl">
        <Row>
          <View>
            <Text variant="headline">Offline mode</Text>
            <Text variant="caption" tone="muted">
              Keep critical insights available without connectivity.
            </Text>
          </View>
          <Switch
            value={offlineModeEnabled}
            onValueChange={(value) => {
              setOfflineMode(value);
              setLastSync(value ? new Date().toISOString() : undefined);
            }}
          />
        </Row>
      </Section>
      <Section rounded="xl">
        <Text variant="headline">Primary crops</Text>
        <Text variant="body" tone="muted">
          {profile.crops.join(', ')}
        </Text>
        {offlineModeEnabled && lastSyncISO ? (
          <Text variant="caption" tone="muted">
            Last synced {new Date(lastSyncISO).toLocaleDateString()}
          </Text>
        ) : null}
      </Section>
      <Button label="Go to dashboard" onPress={() => router.replace('/(app)/(tabs)/dashboard')} fullWidth />
    </Container>
  );
}

