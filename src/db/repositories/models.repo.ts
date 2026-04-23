// src/db/repositories/models.repo.ts
import { getDb } from '../client';
import { InstalledModel } from '../../ai/types';
import { APP_STATE_KEYS } from '../schema';

function rowToInstalledModel(row: Record<string, unknown>): InstalledModel {
  return {
    id: row.id as string,
    localPath: row.localPath as string,
    sizeBytes: row.sizeBytes as number,
    sha256: row.sha256 as string,
    installedAt: row.installedAt as number,
  };
}

export const modelsRepo = {
  markInstalled(model: InstalledModel): void {
    const db = getDb();
    db.execute(
      `INSERT OR REPLACE INTO installed_models (id, localPath, sizeBytes, sha256, installedAt)
       VALUES (?, ?, ?, ?, ?)`,
      [model.id, model.localPath, model.sizeBytes, model.sha256, model.installedAt],
    );
  },

  getAll(): InstalledModel[] {
    const db = getDb();
    const result = db.execute(`SELECT * FROM installed_models ORDER BY installedAt DESC`);
    if (!result.rows) return [];
    return Array.from({ length: result.rows.length }, (_, i) =>
      rowToInstalledModel(result.rows!.item(i) as Record<string, unknown>),
    );
  },

  getById(id: string): InstalledModel | null {
    const db = getDb();
    const result = db.execute(
      `SELECT * FROM installed_models WHERE id = ?`,
      [id],
    );
    if (!result.rows || result.rows.length === 0) return null;
    return rowToInstalledModel(result.rows.item(0) as Record<string, unknown>);
  },

  remove(id: string): void {
    const db = getDb();
    db.execute(`DELETE FROM installed_models WHERE id = ?`, [id]);
  },

  isInstalled(id: string): boolean {
    const db = getDb();
    const result = db.execute(
      `SELECT id FROM installed_models WHERE id = ?`,
      [id],
    );
    return !!(result.rows && result.rows.length > 0);
  },

  // app_state helpers for active model
  getActiveModelId(): string | null {
    const db = getDb();
    const result = db.execute(
      `SELECT value FROM app_state WHERE key = ?`,
      [APP_STATE_KEYS.ACTIVE_MODEL_ID],
    );
    if (!result.rows || result.rows.length === 0) return null;
    return (result.rows.item(0) as Record<string, unknown>).value as string;
  },

  setActiveModelId(id: string): void {
    const db = getDb();
    db.execute(
      `INSERT OR REPLACE INTO app_state (key, value) VALUES (?, ?)`,
      [APP_STATE_KEYS.ACTIVE_MODEL_ID, id],
    );
  },

  clearActiveModelId(): void {
    const db = getDb();
    db.execute(`DELETE FROM app_state WHERE key = ?`, [APP_STATE_KEYS.ACTIVE_MODEL_ID]);
  },
};
