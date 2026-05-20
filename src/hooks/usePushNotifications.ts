import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';

import { authApi } from '@/services/authApi';
import { useAppStore } from '@/store/useAppStore';

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

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    return token;
  } catch {
    return null;
  }
}

export function usePushNotifications() {
  const router = useRouter();
  const accessToken = useAppStore((s) => s.accessToken);
  const authStatus = useAppStore((s) => s.authStatus);
  const responseListener = useRef<any>();

  useEffect(() => {
    if (authStatus !== 'authenticated' || !accessToken) return;
    if (isExpoGo) return;

    registerForPushNotifications().then(async (pushToken) => {
      if (pushToken) {
        try {
          await authApi.updateProfile(accessToken, { pushToken });
        } catch {
          // Non-critical
        }
      }
    });

    try {
      const Notifications = require('expo-notifications');
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response: any) => {
          const data = response.notification.request.content.data;
          if (data?.type === 'disease_outbreak') {
            router.push('/(app)/outbreak-map');
          } else if (data?.type === 'task_reminder') {
            router.push('/(app)/(tabs)/calendar');
          } else {
            router.push('/(app)/notifications');
          }
        },
      );
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
  }, [authStatus, accessToken, router]);
}
