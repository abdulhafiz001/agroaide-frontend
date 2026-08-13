import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { authApi } from '@/services/authApi';

export type PushRegistrationStatus =
  | 'idle'
  | 'registering'
  | 'registered'
  | 'denied'
  | 'unsupported'
  | 'error';

export type PushRegistrationState = {
  status: PushRegistrationStatus;
  detail: string;
  tokenPreview: string | null;
  checkedAt: string | null;
};

/**
 * Expo Go cannot obtain native FCM/APNs tokens. `appOwnership` is deprecated in
 * recent SDKs, so prefer executionEnvironment and keep the old check as backup.
 */
export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  (Constants as unknown as { appOwnership?: string }).appOwnership === 'expo';

let state: PushRegistrationState = {
  status: 'idle',
  detail: 'Not registered yet.',
  tokenPreview: null,
  checkedAt: null,
};

const listeners = new Set<() => void>();

function setState(next: Partial<PushRegistrationState>) {
  state = { ...state, ...next, checkedAt: new Date().toISOString() };
  listeners.forEach((listener) => listener());
}

export function subscribeToPushRegistration(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPushRegistrationState(): PushRegistrationState {
  return state;
}

function describeError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/FirebaseApp is not initialized|google-services|Default FirebaseApp/i.test(message)) {
    return 'This build has no Firebase config (google-services.json). Rebuild the app so push can work.';
  }
  if (/SERVICE_NOT_AVAILABLE|Play Services|GooglePlayServices/i.test(message)) {
    return 'Google Play Services could not reach Firebase. Check the internet connection and try again.';
  }
  return message;
}

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchDeviceToken(): Promise<string> {
  let lastError: unknown = new Error('Device token was empty.');

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const deviceToken = await Notifications.getDevicePushTokenAsync();
      if (typeof deviceToken?.data === 'string' && deviceToken.data.length > 0) {
        return deviceToken.data;
      }
    } catch (error) {
      lastError = error;
    }
    if (attempt < 3) await sleep(800 * attempt);
  }

  throw lastError;
}

/**
 * Obtain the native device token and persist it on the account.
 * Safe to call repeatedly — the backend upserts the token.
 */
export async function registerPushToken(
  accessToken: string,
  options: { requestPermission?: boolean } = {},
): Promise<PushRegistrationState> {
  const { requestPermission = true } = options;

  if (isExpoGo) {
    setState({
      status: 'unsupported',
      detail: 'Expo Go cannot receive push notifications. Install the preview or production build.',
      tokenPreview: null,
    });
    return state;
  }

  if (!Device.isDevice) {
    setState({
      status: 'unsupported',
      detail: 'Push notifications only work on a physical device.',
      tokenPreview: null,
    });
    return state;
  }

  setState({ status: 'registering', detail: 'Registering this device…' });

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted' && requestPermission) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      setState({
        status: 'denied',
        detail: 'Notification permission is not granted for AgroAide.',
        tokenPreview: null,
      });
      return state;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'AgroAide',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#57b346',
      });
    }

    const token = await fetchDeviceToken();
    await authApi.registerPushToken(accessToken, token, Platform.OS);

    setState({
      status: 'registered',
      detail: 'This device is registered for push notifications.',
      tokenPreview: `…${token.slice(-10)}`,
    });
  } catch (error) {
    setState({
      status: 'error',
      detail: describeError(error),
      tokenPreview: null,
    });
  }

  return state;
}
