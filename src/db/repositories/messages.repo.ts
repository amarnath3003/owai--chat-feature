// src/db/repositories/messages.repo.ts
import { getDb } from '../client';
import { Message } from '../../ai/types';

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function rowToMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    conversationId: row.conversationId as string,
    role: row.role as 'user' | 'assistant' | 'system',
    text: row.text as string,
    createdAt: row.createdAt as number,
    updatedAt: row.updatedAt as number,
    modelId: row.modelId as string | undefined,
    isStreaming: false,
  };
}

export const messagesRepo = {
  create(params: {
    conversationId: string;
    role: 'user' | 'assistant' | 'system';
    text: string;
    modelId?: string;
  }): Message {
    const db = getDb();
    const id = generateId();
    const now = Date.now();

    db.execute(
      `INSERT INTO messages (id, conversationId, role, text, createdAt, updatedAt, modelId)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, params.conversationId, params.role, params.text, now, now, params.modelId ?? null],
    );

    return {
      id,
      conversationId: params.conversationId,
      role: params.role,
      text: params.text,
      createdAt: now,
      updatedAt: now,
      modelId: params.modelId,
    };
  },

  getByConversation(conversationId: string): Message[] {
    const db = getDb();
    const result = db.execute(
      `SELECT * FROM messages WHERE conversationId = ? ORDER BY createdAt ASC`,
      [conversationId],
    );
    if (!result.rows) return [];
    return Array.from({ length: result.rows.length }, (_, i) =>
      rowToMessage(result.rows!.item(i) as Record<string, unknown>),
    );
  },

  updateText(id: string, text: string): void {
    const db = getDb();
    db.execute(
      `UPDATE messages SET text = ?, updatedAt = ? WHERE id = ?`,
      [text, Date.now(), id],
    );
  },

  delete(id: string): void {
    const db = getDb();
    db.execute(`DELETE FROM messages WHERE id = ?`, [id]);
  },

  deleteByConversation(conversationId: string): void {
    const db = getDb();
    db.execute(`DELETE FROM messages WHERE conversationId = ?`, [conversationId]);
  },
};
