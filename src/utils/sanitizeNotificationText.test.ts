import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { sanitizeNotificationText } from './sanitizeNotificationText';

describe('sanitizeNotificationText', () => {
  it('strips unclosed think dumps from crop-watch replies', () => {
    const raw = `<think>
Thinking Process:
1. **Deconstruct the Request:**
*   **Goal:** Write 2 short sentences for a Nigerian farmer.
*   **Kind:** window_open
Suggested planting date: 2026-09-01`;

    assert.equal(
      sanitizeNotificationText(raw, 'Good time to plant Tomato around your farm.'),
      'Good time to plant Tomato around your farm.',
    );
  });

  it('keeps farmer-facing copy', () => {
    const text = 'Good time to plant tomato around Abuja. Best date is 1 September 2026.';
    assert.equal(sanitizeNotificationText(text), text);
  });
});
