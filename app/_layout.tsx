import 'react-native-gesture-handler';
import 'react-native-reanimated';

import { Stack } from 'expo-router';
import { AppProviders } from '@/providers/AppProviders';
import { useAppBootstrap } from '@/hooks/useAppBootstrap';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  const { ready } = useAppBootstrap();

  if (!ready) {
    return null;
  }

  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="auth/login" />
        <Stack.Screen name="auth/register" />
        <Stack.Screen name="auth/recovery" />
        <Stack.Screen name="auth/profile" />
        <Stack.Screen name="(app)" />
      </Stack>
    </AppProviders>
  );
}
