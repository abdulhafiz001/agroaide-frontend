import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isSyncStale } from './syncFreshness';

describe('sync freshness', () => {
  it('treats missing and old sync timestamps as stale', () => {
    const now = Date.parse('2026-08-06T12:00:00Z');
    assert.equal(isSyncStale(undefined, now), true);
    assert.equal(isSyncStale('2026-08-06T11:50:00Z', now), true);
  });

  it('keeps a recent successful pull fresh', () => {
    const now = Date.parse('2026-08-06T12:00:00Z');
    assert.equal(isSyncStale('2026-08-06T11:58:00Z', now), false);
  });
});
