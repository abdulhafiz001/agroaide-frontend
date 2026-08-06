export const SYNC_STALE_AFTER_MS = 5 * 60 * 1000;

export function isSyncStale(lastSyncISO?: string, now = Date.now()): boolean {
  if (!lastSyncISO) return true;
  const lastSyncTime = Date.parse(lastSyncISO);
  return !Number.isFinite(lastSyncTime) || now - lastSyncTime >= SYNC_STALE_AFTER_MS;
}
