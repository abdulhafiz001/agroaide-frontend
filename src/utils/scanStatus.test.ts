import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { canPollScan, getScanStatusMessage, normalizeFeedbackReason } from './scanStatus';

describe('scan status helpers', () => {
  it('polls only pending scan states', () => {
    assert.equal(canPollScan('queued'), true);
    assert.equal(canPollScan('processing'), true);
    assert.equal(canPollScan('verified'), false);
    assert.equal(canPollScan('failed'), false);
  });

  it('provides friendly status and normalized feedback', () => {
    assert.equal(getScanStatusMessage('needs_review'), 'Waiting for expert review');
    assert.equal(normalizeFeedbackReason('  Wrong crop   shown  '), 'Wrong crop shown');
    assert.equal(normalizeFeedbackReason('   '), undefined);
  });
});
