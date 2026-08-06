import { createSyncCoordinator } from './syncCoordinator';
import { countPendingSyncActions, drainSyncQueue, syncApi } from './syncEngine';
import { useAppStore } from '@/store/useAppStore';
import { queryClient } from '@/utils/queryClient';

const QUERY_PREFIXES: Record<string, string[]> = {
  farm: ['farmOverview', 'fieldDetail', 'dashboardSnapshot'],
  calendar: ['calendar', 'tasks'],
  finances: ['fieldTransactions', 'fieldEconomics', 'farmEconomics'],
  scans: ['scanHistory', 'farmScan'],
  notifications: ['notifications'],
  advisor: ['advisorHistory', 'advisorSuggestions', 'advisorWeatherContext', 'advisorScanContext', 'dashboardAiInsights'],
};

const coordinator = createSyncCoordinator({
  countPending: countPendingSyncActions,
  drain: drainSyncQueue,
  pull: syncApi.pull,
  getLastSync: () => useAppStore.getState().lastSyncISO,
  setLastSync: (value) => useAppStore.getState().setLastSync(value),
  invalidate: async (groups) => {
    const prefixes = groups.flatMap((group) => QUERY_PREFIXES[group] ?? []);
    await queryClient.invalidateQueries({
      predicate: (query) => prefixes.includes(String(query.queryKey[0] ?? '')),
    });
  },
  log: (message, details) => console.info(message, details ?? {}),
});

export function runAppSync(token: string) {
  return coordinator.sync(token);
}
