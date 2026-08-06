import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createAuthStorage } from './authStorageCore';

describe('secure auth storage', () => {
  it('stores only the access token on native platforms', async () => {
    const writes: [string, string][] = [];
    const storage = createAuthStorage({
      platform: 'native',
      secure: {
        getItemAsync: async () => null,
        setItemAsync: async (key, value) => {
          writes.push([key, value]);
        },
        deleteItemAsync: async () => {},
      },
      legacy: {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      },
    });

    await storage.saveToken('secret-token');
    assert.deepEqual(writes, [['agroaide_access_token', 'secret-token']]);
  });

  it('keeps web tokens in memory and clears legacy keys', async () => {
    const removed: string[] = [];
    const storage = createAuthStorage({
      platform: 'web',
      secure: {
        getItemAsync: async () => null,
        setItemAsync: async () => {},
        deleteItemAsync: async () => {},
      },
      legacy: {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async (key) => {
          removed.push(key);
        },
      },
    });

    await storage.saveToken('web-token');
    assert.equal(await storage.loadToken(), 'web-token');
    await storage.clearLegacyAuthData();
    assert.deepEqual(removed.sort(), ['agroaide-store', 'agroaide_remembered_login'].sort());
    assert.equal(await storage.loadToken(), null);
  });

  it('runs the pre-production sign-out migration once', async () => {
    let marker: string | null = null;
    let deletes = 0;
    const storage = createAuthStorage({
      platform: 'native',
      secure: {
        getItemAsync: async () => 'old-token',
        setItemAsync: async () => {},
        deleteItemAsync: async () => {
          deletes += 1;
        },
      },
      legacy: {
        getItem: async () => marker,
        setItem: async (_key, value) => {
          marker = value;
        },
        removeItem: async () => {},
      },
    });

    assert.equal(await storage.migrateLegacyAuthData(), true);
    assert.equal(await storage.migrateLegacyAuthData(), false);
    assert.equal(deletes, 1);
  });
});
