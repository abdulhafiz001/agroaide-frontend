import NetInfo from '@react-native-community/netinfo';
import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { runAppSync } from '@/services/appSync';
import { countPendingSyncActions } from '@/services/syncEngine';
import { isSyncStale } from '@/services/syncFreshness';
import { useAppStore } from '@/store/useAppStore';

/** Watches connectivity and drains the offline action queue on reconnect. */
export function SyncBootstrap() {
  const token = useAppStore((s) => s.accessToken);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!token) return;

    const syncIfNeeded = async (reason: 'connectivity' | 'foreground') => {
      const state = await NetInfo.fetch();
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (!online) {
        wasOffline.current = true;
        return;
      }

      const pending = await countPendingSyncActions();
      const lastSync = useAppStore.getState().lastSyncISO;
      if (pending === 0 && !wasOffline.current && !isSyncStale(lastSync)) return;

      try {
        await runAppSync(token);
        wasOffline.current = false;
      } catch (error) {
        console.info('[sync] automatic attempt deferred', {
          reason,
          message: error instanceof Error ? error.message : 'unknown error',
        });
      }
    };

    void syncIfNeeded('foreground');
    const unsubscribe = NetInfo.addEventListener((state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (!online) {
        wasOffline.current = true;
        return;
      }
      void syncIfNeeded('connectivity');
    });
    const appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') void syncIfNeeded('foreground');
    });

    return () => {
      unsubscribe();
      appStateSubscription.remove();
    };
  }, [token]);

  return null;
}
