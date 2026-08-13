import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { useRouter } from 'expo-router';

import {
  getPushRegistrationState,
  isExpoGo,
  registerPushToken,
  subscribeToPushRegistration,
} from '@/services/pushRegistration';
import { queryClient } from '@/utils/queryClient';
import { useAppStore } from '@/store/useAppStore';
import { routeForNotification } from '@/utils/notificationRouting';

function setupNotificationHandler() {
  if (isExpoGo) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

setupNotificationHandler();

/** Live registration state for the diagnostics card in Settings. */
export function usePushRegistrationState() {
  return useSyncExternalStore(subscribeToPushRegistration, getPushRegistrationState, getPushRegistrationState);
}

function openFromNotification(router: ReturnType<typeof useRouter>, response: any) {
  const content = response?.notification?.request?.content ?? {};
  const data = (content.data ?? {}) as Record<string, unknown>;
  const route = routeForNotification(String(data.type ?? ''), data, {
    title: content.title,
    message: content.body,
  });

  if (route.params && Object.keys(route.params).length > 0) {
    router.push({ pathname: route.pathname, params: route.params } as any);
  } else {
    router.push(route.pathname as any);
  }
}

export function usePushNotifications() {
  const router = useRouter();
  const accessToken = useAppStore((s) => s.accessToken);
  const authStatus = useAppStore((s) => s.authStatus);
  const responseListener = useRef<any>(null);
  const handledColdStartRef = useRef(false);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !accessToken) return;
    if (isExpoGo) return;

    void registerPushToken(accessToken);

    // Permission can be granted from Android settings while the app is backgrounded,
    // and the first token fetch can fail on a cold boot — retry when we come back.
    const appStateSub = AppState.addEventListener('change', (next) => {
      if (next !== 'active') return;
      const { status } = getPushRegistrationState();
      if (status === 'registered' || status === 'registering') return;
      void registerPushToken(accessToken, { requestPermission: false });
    });

    let receivedSub: { remove: () => void } | null = null;

    try {
      // Cold start: app opened from a killed state by tapping a notification
      if (!handledColdStartRef.current) {
        handledColdStartRef.current = true;
        Notifications.getLastNotificationResponseAsync?.().then((response: any) => {
          if (response) openFromNotification(router, response);
        });
      }

      // When a push arrives (foreground), refresh the in-app inbox immediately.
      receivedSub = Notifications.addNotificationReceivedListener(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        queryClient.invalidateQueries({ queryKey: ['dashboardSnapshot'] });
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        openFromNotification(router, response);
      });
    } catch {
      // Notification APIs are unavailable in Expo Go
    }

    // Keep inbox warm even if the user never opens the Notifications page.
    const pollId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, 90_000);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

    return () => {
      clearInterval(pollId);
      appStateSub.remove();
      receivedSub?.remove();
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [authStatus, accessToken, router]);
}
