import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'agroaide_remembered_login';

export type RememberedCredentials = {
  identifier: string;
  password: string;
};

export async function saveRememberedCredentials(creds: RememberedCredentials) {
  await AsyncStorage.setItem(KEY, JSON.stringify(creds));
}

export async function loadRememberedCredentials(): Promise<RememberedCredentials | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RememberedCredentials;
    if (!parsed?.identifier || !parsed?.password) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearRememberedCredentials() {
  await AsyncStorage.removeItem(KEY);
}
