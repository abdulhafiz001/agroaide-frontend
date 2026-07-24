import * as SQLite from 'expo-sqlite';

export type SyncActionType =
  | 'field.create'
  | 'field.update'
  | 'field.delete'
  | 'journal.create'
  | 'task.create'
  | 'task.update'
  | 'task.complete'
  | 'task.delete'
  | 'transaction.create'
  | 'transaction.update'
  | 'transaction.delete'
  | 'boundary.update';

export type SyncAction = {
  uuid: string;
  clientTimestamp: string;
  actionType: SyncActionType;
  payload: Record<string, unknown>;
  synced?: boolean;
  attempts?: number;
  lastError?: string | null;
};

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('agroaide_sync.db');
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS sync_actions (
          uuid TEXT PRIMARY KEY NOT NULL,
          client_timestamp TEXT NOT NULL,
          action_type TEXT NOT NULL,
          payload TEXT NOT NULL,
          synced INTEGER NOT NULL DEFAULT 0,
          attempts INTEGER NOT NULL DEFAULT 0,
          last_error TEXT
        );
      `);
      return db;
    })();
  }
  return dbPromise;
}

export async function enqueueSyncAction(action: SyncAction): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO sync_actions (uuid, client_timestamp, action_type, payload, synced, attempts, last_error)
     VALUES (?, ?, ?, ?, 0, COALESCE ?, ?)`,
    action.uuid,
    action.clientTimestamp,
    action.actionType,
    JSON.stringify(action.payload ?? {}),
    action.attempts ?? 0,
    action.lastError ?? null,
  );
}

export async function listPendingSyncActions(): Promise<SyncAction[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    uuid: string;
    client_timestamp: string;
    action_type: string;
    payload: string;
    synced: number;
    attempts: number;
    last_error: string | null;
  }>('SELECT * FROM sync_actions WHERE synced = 0 ORDER BY client_timestamp ASC');

  return rows.map((row) => ({
    uuid: row.uuid,
    clientTimestamp: row.client_timestamp,
    actionType: row.action_type as SyncActionType,
    payload: JSON.parse(row.payload || '{}'),
    synced: false,
    attempts: row.attempts,
    lastError: row.last_error,
  }));
}

export async function countPendingSyncActions(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ c: number }>(
    'SELECT COUNT(*) as c FROM sync_actions WHERE synced = 0',
  );
  return row?.c ?? 0;
}

export async function markSyncActionSynced(uuid: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE sync_actions SET synced = 1, last_error = NULL WHERE uuid = ?', uuid);
}

export async function markSyncActionFailed(uuid: string, error: string): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE sync_actions SET attempts = attempts + 1, last_error = ? WHERE uuid = ?',
    error,
    uuid,
  );
}

export async function clearSyncedActions(): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM sync_actions WHERE synced = 1');
}
