const TOKEN_KEY = 'agroaide_access_token';
const AUTH_SCHEMA_KEY = 'agroaide_auth_schema';
const AUTH_SCHEMA_VERSION = '2';
const LEGACY_KEYS = ['agroaide_remembered_login', 'agroaide-store'] as const;

type SecureAdapter = {
  getItemAsync(key: string): Promise<string | null>;
  setItemAsync(key: string, value: string): Promise<void>;
  deleteItemAsync(key: string): Promise<void>;
};

type LegacyAdapter = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export function createAuthStorage(dependencies: {
  platform: 'native' | 'web';
  secure: SecureAdapter;
  legacy: LegacyAdapter;
}) {
  let webToken: string | null = null;

  return {
    async saveToken(token: string): Promise<void> {
      if (dependencies.platform === 'web') {
        webToken = token;
        return;
      }
      await dependencies.secure.setItemAsync(TOKEN_KEY, token);
    },

    async loadToken(): Promise<string | null> {
      if (dependencies.platform === 'web') return webToken;
      return dependencies.secure.getItemAsync(TOKEN_KEY);
    },

    async clearToken(): Promise<void> {
      webToken = null;
      if (dependencies.platform !== 'web') {
        await dependencies.secure.deleteItemAsync(TOKEN_KEY);
      }
    },

    async clearLegacyAuthData(): Promise<void> {
      await Promise.all(LEGACY_KEYS.map((key) => dependencies.legacy.removeItem(key)));
      await this.clearToken();
    },

    async migrateLegacyAuthData(): Promise<boolean> {
      if ((await dependencies.legacy.getItem(AUTH_SCHEMA_KEY)) === AUTH_SCHEMA_VERSION) {
        return false;
      }
      await this.clearLegacyAuthData();
      await dependencies.legacy.setItem(AUTH_SCHEMA_KEY, AUTH_SCHEMA_VERSION);
      return true;
    },
  };
}
