import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { authApi } from '@/services/authApi';
import { queryClient } from '@/utils/queryClient';
import { useAppStore } from '@/store/useAppStore';
import { routeForNotification } from '@/utils/notificationRouting';

const isExpoGo = Constants.appOwnership === 'expo';

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

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGo) return null;

  try {
    if (!Device.isDevice) {
      console.warn('[push] skipped — not a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[push] permission not granted:', finalStatus);
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'AgroAide',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#57b346',
      });
    }

    // Native FCM (Android) / APNs (iOS) token for direct FCM HTTP v1
    let lastError: unknown = null;
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const deviceToken = await Notifications.getDevicePushTokenAsync();
        if (typeof deviceToken?.data === 'string' && deviceToken.data.length > 0) {
          return deviceToken.data;
        }
        lastError = new Error('empty device token');
      } catch (error) {
        lastError = error;
        console.warn(`[push] getDevicePushTokenAsync attempt ${attempt} failed`, error);
        await sleep(800 * attempt);
      }
    }

    console.warn('[push] could not obtain device token', lastError);
    return null;
  } catch (error) {
    console.warn('[push] registerForPushNotifications failed', error);
    return null;
  }
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

    let cancelled = false;

    (async () => {
      const pushToken = await registerForPushNotifications();
      if (cancelled || !pushToken) return;

      try {
        // Dedicated endpoint — not blocked by consent.current (428 on /profile).
        await authApi.registerPushToken(accessToken, pushToken, Platform.OS);
        console.info('[push] device token registered with backend');
      } catch (e) {
        console.warn('[push] failed to upload token', e);
      }
    })();

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
      // Not available in Expo Go
    }

    // Keep inbox warm even if the user never opens the Notifications page.
    const pollId = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }, 90_000);
    queryClient.invalidateQueries({ queryKey: ['notifications'] });

    return () => {
      cancelled = true;
      clearInterval(pollId);
      receivedSub?.remove();
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [authStatus, accessToken, router]);
}
