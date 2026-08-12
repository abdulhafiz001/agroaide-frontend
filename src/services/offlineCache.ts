import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'agroaide.offlineCache.v1:';

type CacheEnvelope<T> = {
  savedAt: string;
  data: T;
};

export async function saveOfflineCache<T>(key: string, data: T): Promise<void> {
  try {
    const envelope: CacheEnvelope<T> = { savedAt: new Date().toISOString(), data };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(envelope));
  } catch {
    // Best-effort cache
  }
}

export async function loadOfflineCache<T>(key: string): Promise<CacheEnvelope<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed?.data) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function formatCacheAge(iso?: string | null): string {
  if (!iso) return 'earlier';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return 'earlier';
  }
}
