import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createSyncCoordinator } from './syncCoordinator';

describe('sync coordinator', () => {
  it('uses server time and invalidates affected query groups', async () => {
    const events: string[] = [];
    let savedTime: string | undefined;
    const coordinator = createSyncCoordinator({
      countPending: async () => 2,
      drain: async () => {
        events.push('drain');
        return { pendingBefore: 2, applied: 2, conflicts: 0, failed: 0 };
      },
      pull: async (_token, since) => {
        events.push(`pull:${since}`);
        return { serverTime: '2026-08-06T08:00:00Z' };
      },
      invalidate: async (groups) => {
        events.push(`invalidate:${groups.join(',')}`);
      },
      getLastSync: () => '2026-08-05T08:00:00Z',
      setLastSync: (value) => {
        savedTime = value;
      },
      log: () => {},
    });

    const result = await coordinator.sync('token');
    assert.equal(result.serverTime, '2026-08-06T08:00:00Z');
    assert.equal(savedTime, '2026-08-06T08:00:00Z');
    assert.deepEqual(events, [
      'drain',
      'pull:2026-08-05T08:00:00Z',
      'invalidate:farm,calendar,finances,scans,notifications,advisor',
    ]);
  });
});
