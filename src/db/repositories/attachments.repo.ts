// src/db/repositories/attachments.repo.ts
import { getDb } from '../client';
import { Attachment } from '../../ai/types';

function generateId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function rowToAttachment(row: Record<string, unknown>): Attachment {
  return {
    id: row.id as string,
    messageId: row.messageId as string,
    type: row.type as 'image',
    localPath: row.localPath as string,
    mime: row.mime as string,
    width: row.width as number | undefined,
    height: row.height as number | undefined,
  };
}

export const attachmentsRepo = {
  create(params: Omit<Attachment, 'id'>): Attachment {
    const db = getDb();
    const id = generateId();

    db.execute(
      `INSERT INTO attachments (id, messageId, type, localPath, mime, width, height)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, params.messageId, params.type, params.localPath, params.mime,
       params.width ?? null, params.height ?? null],
    );

    return { id, ...params };
  },

  getByMessage(messageId: string): Attachment[] {
    const db = getDb();
    const result = db.execute(
      `SELECT * FROM attachments WHERE messageId = ?`,
      [messageId],
    );
    if (!result.rows) return [];
    return Array.from({ length: result.rows.length }, (_, i) =>
      rowToAttachment(result.rows!.item(i) as Record<string, unknown>),
    );
  },

  delete(id: string): void {
    const db = getDb();
    db.execute(`DELETE FROM attachments WHERE id = ?`, [id]);
  },
};
