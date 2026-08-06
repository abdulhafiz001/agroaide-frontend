import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { sanitizeMapColor, serializeForInlineScript, sanitizeMapText } from './mapSecurity';

describe('map content security', () => {
  it('escapes HTML in marker text', () => {
    assert.equal(
      sanitizeMapText('<img src=x onerror=alert(1)> & "farm"'),
      '&lt;img src=x onerror=alert(1)&gt; &amp; &quot;farm&quot;',
    );
  });

  it('prevents closing an inline script element', () => {
    const serialized = serializeForInlineScript({ label: '</script><script>alert(1)</script>' });
    assert.equal(serialized.includes('</script>'), false);
    assert.equal(serialized.includes('\\u003c/script\\u003e'), true);
  });

  it('allows supported map colors and rejects CSS injection', () => {
    assert.equal(sanitizeMapColor('#57b346', '#000000'), '#57b346');
    assert.equal(sanitizeMapColor('rgb(12, 34, 56)', '#000000'), 'rgb(12, 34, 56)');
    assert.equal(sanitizeMapColor('red; background:url(javascript:alert(1))', '#000000'), '#000000');
  });
});
