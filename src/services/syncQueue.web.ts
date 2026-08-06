import AsyncStorage from '@react-native-async-storage/async-storage';

export type SyncActionType =
  | 'field.create'
  | 'field.update'
  | 'field.delete'
  | 'journal.create'
  | 'journal.update'
  | 'journal.delete'
  | 'task.create'
  | 'task.update'
  | 'task.complete'
  | 'task.delete'
  | 'transaction.create'
  | 'transaction.update'
  | 'transaction.delete'
  | 'boundary.update'
  | 'boundary.delete';

export type SyncAction = {
  uuid: string;
  clientTimestamp: string;
  actionType: SyncActionType;
  payload: Record<string, unknown>;
  synced?: boolean;
  attempts?: number;
  lastError?: string | null;
};

const WEB_QUEUE_KEY = 'agroaide_sync_queue_v2';

async function readQueue(): Promise<SyncAction[]> {
  const raw = await AsyncStorage.getItem(WEB_QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SyncAction[];
  } catch {
    return [];
  }
}

async function writeQueue(queue: SyncAction[]): Promise<void> {
  await AsyncStorage.setItem(WEB_QUEUE_KEY, JSON.stringify(queue));
}

export async function enqueueSyncAction(action: SyncAction): Promise<void> {
  const queue = await readQueue();
  await writeQueue([...queue.filter((item) => item.uuid !== action.uuid), { ...action, synced: false }]);
}

export async function listPendingSyncActions(): Promise<SyncAction[]> {
  return (await readQueue())
    .filter((action) => !action.synced)
    .sort((a, b) => a.clientTimestamp.localeCompare(b.clientTimestamp));
}

export async function countPendingSyncActions(): Promise<number> {
  return (await listPendingSyncActions()).length;
}

export async function markSyncActionSynced(uuid: string): Promise<void> {
  await writeQueue((await readQueue()).map((action) =>
    action.uuid === uuid ? { ...action, synced: true, lastError: null } : action,
  ));
}

export async function markSyncActionFailed(uuid: string, error: string): Promise<void> {
  await writeQueue((await readQueue()).map((action) =>
    action.uuid === uuid
      ? { ...action, attempts: (action.attempts ?? 0) + 1, lastError: error }
      : action,
  ));
}

export async function clearSyncedActions(): Promise<void> {
  await writeQueue((await readQueue()).filter((action) => !action.synced));
}

export async function clearAllSyncActions(): Promise<void> {
  await AsyncStorage.removeItem(WEB_QUEUE_KEY);
}
