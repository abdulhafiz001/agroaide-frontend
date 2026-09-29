import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isValidPersonName, normalizePersonName } from './validatePersonName';

describe('validatePersonName', () => {
  it('accepts first and last names, including Nigerian and hyphenated names', () => {
    assert.equal(isValidPersonName('Adaeze Okonkwo'), true);
    assert.equal(isValidPersonName('Mary-Jane Okafor'), true);
    assert.equal(isValidPersonName("O'Brien Musa"), true);
    assert.equal(isValidPersonName('A. Ibrahim'), true);
    assert.equal(isValidPersonName('  Chioma   Adaeze  '), true);
  });

  it('rejects a single word or junk values', () => {
    assert.equal(isValidPersonName('John'), false);
    assert.equal(isValidPersonName('asdf'), false);
    assert.equal(isValidPersonName('123 456'), false);
    assert.equal(isValidPersonName('test@farm.com'), false);
    assert.equal(isValidPersonName('A. B.'), false);
  });

  it('collapses extra spaces', () => {
    assert.equal(normalizePersonName('  Adaeze   Okonkwo '), 'Adaeze Okonkwo');
  });
});
