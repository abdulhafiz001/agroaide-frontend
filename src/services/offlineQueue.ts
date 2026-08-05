import { enqueueSyncAction, type SyncActionType } from '@/services/syncQueue';
import { useAppStore } from '@/store/useAppStore';
import { createClientUuid } from '@/utils/geoArea';

/**
 * Run an online API call; if it fails (typically offline / network),
 * enqueue a sync action so SyncBootstrap can push it on reconnect.
 *
 * Throws a tagged error so UI can show "Queued offline" instead of a hard failure.
 * Respects Settings → Offline sync toggle.
 */
export async function withOfflineQueue<T>(opts: {
  runOnline: (clientUuid: string) => Promise<T>;
  actionType: SyncActionType;
  buildPayload: (clientUuid: string) => Record<string, unknown>;
  /** Reuse uuid for updates/deletes that already have a server id */
  uuid?: string;
}): Promise<T> {
  const clientUuid = opts.uuid ?? createClientUuid();
  const clientTimestamp = new Date().toISOString();

  try {
    return await opts.runOnline(clientUuid);
  } catch (error) {
    if (!useAppStore.getState().offlineModeEnabled) {
      throw error;
    }
    await enqueueSyncAction({
      uuid: clientUuid,
      clientTimestamp,
      actionType: opts.actionType,
      payload: {
        ...opts.buildPayload(clientUuid),
        clientUuid,
        clientTimestamp,
      },
    });
    const queued = new Error('OFFLINE_QUEUED');
    (queued as Error & { cause?: unknown }).cause = error;
    throw queued;
  }
}

export function isOfflineQueuedError(error: unknown): boolean {
  return error instanceof Error && error.message === 'OFFLINE_QUEUED';
}
