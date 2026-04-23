// src/db/client.ts
// SQLite connection manager with migration support

import { open, QuickSQLiteConnection } from 'react-native-quick-sqlite';
import {
  CREATE_TABLES_SQL,
  MIGRATIONS,
  SCHEMA_VERSION,
  APP_STATE_KEYS,
} from './schema';

const DB_NAME = 'pocketai.db';

let _db: QuickSQLiteConnection | null = null;

/**
 * Returns the singleton DB connection.
 * Throws if the DB has not been initialized yet.
 */
export function getDb(): QuickSQLiteConnection {
  if (!_db) {
    throw new Error(
      '[DB] Database not initialized. Call initDb() first.',
    );
  }
  return _db;
}

/**
 * Initializes the SQLite database, creates tables, and runs migrations.
 * Must be called once at app startup before any repo is used.
 */
export async function initDb(): Promise<void> {
  if (_db) {
    return; // Already initialized
  }

  try {
    _db = open({ name: DB_NAME });

    // Enable WAL mode for better concurrent performance
    _db.execute('PRAGMA journal_mode=WAL;');
    _db.execute('PRAGMA foreign_keys=ON;');

    // Create all tables
    _db.execute(CREATE_TABLES_SQL);

    // Run migrations
    await runMigrations(_db);

    console.log('[DB] Initialized successfully');
  } catch (error) {
    _db = null;
    throw new Error(`[DB] Initialization failed: ${String(error)}`);
  }
}

async function runMigrations(db: QuickSQLiteConnection): Promise<void> {
  // Read current version from app_state
  const result = db.execute(
    `SELECT value FROM app_state WHERE key = ?`,
    [APP_STATE_KEYS.DB_VERSION],
  );

  const currentVersion =
    result.rows && result.rows.length > 0
      ? parseInt(result.rows.item(0).value as string, 10)
      : 0;

  if (currentVersion < SCHEMA_VERSION) {
    for (let v = currentVersion + 1; v <= SCHEMA_VERSION; v++) {
      const sql = MIGRATIONS[v];
      if (sql) {
        db.execute(sql);
        console.log(`[DB] Ran migration to version ${v}`);
      }
    }

    // Upsert the schema version
    db.execute(
      `INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)`,
      [APP_STATE_KEYS.DB_VERSION, String(SCHEMA_VERSION)],
    );
  }
}

/**
 * Closes the database connection. Call on app shutdown if needed.
 */
export function closeDb(): void {
  if (_db) {
    _db.close();
    _db = null;
    console.log('[DB] Connection closed');
  }
}
