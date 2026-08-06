import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo, useState } from 'react';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

import { authApi } from '@/services/authApi';
import { clearAllSyncActions } from '@/services/syncQueue';
import { useAppStore, useStoreHydration } from '@/store/useAppStore';
import { authStorage } from '@/utils/authStorage';
import { clearAuthQueryCache } from '@/utils/queryClient';

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
  const [authReady, setAuthReady] = useState(false);
  const ready = useMemo(() => fontsLoaded && hydrated && authReady, [fontsLoaded, hydrated, authReady]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let active = true;
    (async () => {
      try {
        const migrated = await authStorage.migrateLegacyAuthData();
        if (migrated) {
          await clearAllSyncActions().catch(() => {});
          console.info('[auth] legacy credentials cleared; existing session signed out');
          clearAuthQueryCache();
          useAppStore.getState().signOut();
          return;
        }

        const accessToken = await authStorage.loadToken();
        if (!accessToken) {
          await clearAllSyncActions().catch(() => {});
          useAppStore.getState().signOut();
          return;
        }

        console.info('[auth] restoring secure native session');
        useAppStore.getState().setAuthState({ status: 'authenticated', token: accessToken });
        const response = await authApi.me(accessToken);
        useAppStore.getState().setFarmerProfile(response.profile);
      } catch (error) {
        console.info('[auth] session restore failed; signing out', {
          message: error instanceof Error ? error.message : 'unknown error',
        });
        await Promise.all([
          authStorage.clearToken().catch(() => {}),
          clearAllSyncActions().catch(() => {}),
        ]);
        clearAuthQueryCache();
        useAppStore.getState().signOut();
      } finally {
        if (active) setAuthReady(true);
      }
    })();

    return () => {
      active = false;
    };
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

