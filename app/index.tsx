import { Redirect } from 'expo-router';

import { useAppStore } from '@/store/useAppStore';

export default function IndexRoute() {
  const onboardingCompleted = useAppStore((state) => state.onboardingCompleted);
  const authStatus = useAppStore((state) => state.authStatus);

  if (!onboardingCompleted) {
    return <Redirect href="/onboarding" />;
  }

  if (authStatus !== 'authenticated') {
    return <Redirect href="/auth/login" />;
  }

  return <Redirect href="/(app)/(tabs)/dashboard" />;
}

