export const SYNC_QUERY_GROUPS = ['farm', 'calendar', 'finances', 'scans', 'notifications', 'advisor'] as const;

type SyncSummary = {
  pendingBefore: number;
  applied: number;
  conflicts: number;
  failed: number;
};

type CoordinatorDependencies = {
  countPending: () => Promise<number>;
  drain: (token: string) => Promise<SyncSummary>;
  pull: (token: string, since?: string) => Promise<{ serverTime: string }>;
  invalidate: (groups: readonly string[]) => Promise<void>;
  getLastSync: () => string | undefined;
  setLastSync: (value: string) => void;
  log: (message: string, details?: Record<string, unknown>) => void;
};

export function createSyncCoordinator(dependencies: CoordinatorDependencies) {
  let activeSync: Promise<{ serverTime: string; summary: SyncSummary }> | null = null;

  return {
    sync(token: string) {
      if (activeSync) return activeSync;

      activeSync = (async () => {
        const pending = await dependencies.countPending();
        dependencies.log('[sync] started', { pending });
        const summary = await dependencies.drain(token);
        const pulled = await dependencies.pull(token, dependencies.getLastSync());
        dependencies.setLastSync(pulled.serverTime);
        await dependencies.invalidate(SYNC_QUERY_GROUPS);
        dependencies.log('[sync] completed', {
          pending: summary.pendingBefore,
          applied: summary.applied,
          conflicts: summary.conflicts,
          failed: summary.failed,
        });
        return { serverTime: pulled.serverTime, summary };
      })().finally(() => {
        activeSync = null;
      });

      return activeSync;
    },
  };
}
