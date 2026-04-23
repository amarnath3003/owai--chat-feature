// src/db/repositories/conversations.repo.ts
import { getDb } from '../client';
import { Conversation } from '../../ai/types';

function generateId(): string {
  return `conv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function rowToConversation(row: Record<string, unknown>): Conversation {
  return {
    id: row.id as string,
    title: row.title as string,
    createdAt: row.createdAt as number,
    updatedAt: row.updatedAt as number,
  };
}

export const conversationsRepo = {
  create(title: string = 'New Chat'): Conversation {
    const db = getDb();
    const id = generateId();
    const now = Date.now();

    db.execute(
      `INSERT INTO conversations (id, title, createdAt, updatedAt) VALUES (?, ?, ?, ?)`,
      [id, title, now, now],
    );

    return { id, title, createdAt: now, updatedAt: now };
  },

  getAll(): Conversation[] {
    const db = getDb();
    const result = db.execute(
      `SELECT * FROM conversations ORDER BY updatedAt DESC`,
    );
    if (!result.rows) return [];
    return Array.from({ length: result.rows.length }, (_, i) =>
      rowToConversation(result.rows!.item(i) as Record<string, unknown>),
    );
  },

  getById(id: string): Conversation | null {
    const db = getDb();
    const result = db.execute(
      `SELECT * FROM conversations WHERE id = ?`,
      [id],
    );
    if (!result.rows || result.rows.length === 0) return null;
    return rowToConversation(result.rows.item(0) as Record<string, unknown>);
  },

  updateTitle(id: string, title: string): void {
    const db = getDb();
    db.execute(
      `UPDATE conversations SET title = ?, updatedAt = ? WHERE id = ?`,
      [title, Date.now(), id],
    );
  },

  touch(id: string): void {
    const db = getDb();
    db.execute(
      `UPDATE conversations SET updatedAt = ? WHERE id = ?`,
      [Date.now(), id],
    );
  },

  delete(id: string): void {
    const db = getDb();
    db.execute(`DELETE FROM conversations WHERE id = ?`, [id]);
  },
};
