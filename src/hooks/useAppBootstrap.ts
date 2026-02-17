import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import { authApi } from '@/services/authApi';
import { useAppStore, useStoreHydration } from '@/store/useAppStore';

SplashScreen.preventAutoHideAsync().catch(() => {
  // ignore if already prevented
});

export const useAppBootstrap = () => {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const hydrated = useStoreHydration();
  const ready = useMemo(() => fontsLoaded && hydrated, [fontsLoaded, hydrated]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const { authStatus, accessToken } = useAppStore.getState();
    if (authStatus !== 'authenticated' || !accessToken) {
      return;
    }

    authApi
      .me(accessToken)
      .then((response) => {
        useAppStore.getState().setFarmerProfile(response.profile);
      })
      .catch(() => {
        useAppStore.getState().signOut();
      });
  }, [hydrated]);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  return {
    ready,
  };
};

