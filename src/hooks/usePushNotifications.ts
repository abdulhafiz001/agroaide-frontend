import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { authApi } from '@/services/authApi';
import { useAppStore } from '@/store/useAppStore';
import { routeForNotification } from '@/utils/notificationRouting';

const isExpoGo = Constants.appOwnership === 'expo';

function setupNotificationHandler() {
  if (isExpoGo) return;
  try {
    const Notifications = require('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch {
    // expo-notifications not available
  }
}

setupNotificationHandler();

async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGo) return null;

  try {
    const Device = require('expo-device');
    if (!Device.isDevice) return null;

    const Notifications = require('expo-notifications');

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'AgroAide',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#57b346',
      });
    }

    // Native FCM (Android) / APNs (iOS) token for direct FCM HTTP v1
    const deviceToken = await Notifications.getDevicePushTokenAsync();
    return typeof deviceToken?.data === 'string' ? deviceToken.data : null;
  } catch {
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
  const notificationPreferences = useAppStore((s) => s.notificationPreferences);
  const responseListener = useRef<any>();
  const handledColdStartRef = useRef(false);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !accessToken) return;
    if (isExpoGo) return;

    registerForPushNotifications().then(async (pushToken) => {
      try {
        await authApi.updateProfile(accessToken, {
          ...(pushToken ? { pushToken } : {}),
          notificationPreferences,
        });
      } catch {
        // Non-critical
      }
    });

    try {
      const Notifications = require('expo-notifications');

      // Cold start: app opened from a killed state by tapping a notification
      if (!handledColdStartRef.current) {
        handledColdStartRef.current = true;
        Notifications.getLastNotificationResponseAsync?.().then((response: any) => {
          if (response) openFromNotification(router, response);
        });
      }

      responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
        openFromNotification(router, response);
      });
    } catch {
      // Not available in Expo Go
    }

    return () => {
      if (responseListener.current) {
        try {
          const Notifications = require('expo-notifications');
          Notifications.removeNotificationSubscription(responseListener.current);
        } catch {
          // Cleanup failed silently
        }
      }
    };
  }, [authStatus, accessToken, router, notificationPreferences]);
}
