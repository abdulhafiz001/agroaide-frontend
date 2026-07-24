import { apiRequest } from '@/services/apiClient';
import {
  clearSyncedActions,
  countPendingSyncActions,
  listPendingSyncActions,
  markSyncActionFailed,
  markSyncActionSynced,
  type SyncAction,
} from '@/services/syncQueue';

export type SyncDeltaResult = {
  results: Array<{
    uuid: string;
    status: 'applied' | 'conflict' | 'rejected' | 'duplicate';
    serverEntity?: unknown;
    conflict?: unknown;
    message?: string;
  }>;
};

export const syncApi = {
  pushDelta(token: string, actions: SyncAction[]) {
    return apiRequest<SyncDeltaResult>('/sync/delta', {
      method: 'POST',
      token,
      body: {
        actions: actions.map((a) => ({
          uuid: a.uuid,
          clientTimestamp: a.clientTimestamp,
          actionType: a.actionType,
          payload: a.payload,
        })),
      },
    });
  },

  pull(token: string, since?: string) {
    const qs = since ? `?since=${encodeURIComponent(since)}` : '';
    return apiRequest<{
      since: string | null;
      serverTime: string;
      fields: unknown[];
      tasks: unknown[];
      transactions: unknown[];
      journal: unknown[];
    }>(`/sync/pull${qs}`, { token });
  },
};

export async function drainSyncQueue(token: string): Promise<{
  pendingBefore: number;
  applied: number;
  conflicts: number;
  failed: number;
}> {
  const pending = await listPendingSyncActions();
  if (!token || pending.length === 0) {
    return { pendingBefore: 0, applied: 0, conflicts: 0, failed: 0 };
  }

  let applied = 0;
  let conflicts = 0;
  let failed = 0;

  try {
    const response = await syncApi.pushDelta(token, pending);
    for (const result of response.results ?? []) {
      if (result.status === 'applied' || result.status === 'duplicate') {
        await markSyncActionSynced(result.uuid);
        applied += 1;
      } else if (result.status === 'conflict') {
        conflicts += 1;
        await markSyncActionFailed(result.uuid, 'conflict');
      } else {
        failed += 1;
        await markSyncActionFailed(result.uuid, result.message || 'rejected');
      }
    }
    await clearSyncedActions();
  } catch (error: any) {
    failed = pending.length;
    for (const action of pending) {
      await markSyncActionFailed(action.uuid, error?.message || 'network error');
    }
  }

  return {
    pendingBefore: pending.length,
    applied,
    conflicts,
    failed,
  };
}

export { countPendingSyncActions };
