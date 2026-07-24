import NetInfo from '@react-native-community/netinfo';
import React, { useEffect, useRef } from 'react';

import { countPendingSyncActions, drainSyncQueue, syncApi } from '@/services/syncEngine';
import { useAppStore } from '@/store/useAppStore';

/** Watches connectivity and drains the offline action queue on reconnect. */
export function SyncBootstrap() {
  const token = useAppStore((s) => s.accessToken);
  const setLastSync = useAppStore((s) => s.setLastSync);
  const lastSyncISO = useAppStore((s) => s.lastSyncISO);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!token) return;

    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      if (!online) {
        wasOffline.current = true;
        return;
      }

      const pending = await countPendingSyncActions();
      if (pending === 0 && !wasOffline.current) return;

      try {
        await drainSyncQueue(token);
        await syncApi.pull(token, lastSyncISO);
        setLastSync(new Date().toISOString());
        wasOffline.current = false;
      } catch {
        // Keep queue; next reconnect retries
      }
    });

    return () => unsubscribe();
  }, [token, lastSyncISO, setLastSync]);

  return null;
}
