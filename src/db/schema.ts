// src/db/schema.ts
// All CREATE TABLE SQL statements with indexes for the PocketAI database

export const SCHEMA_VERSION = 1;

export const CREATE_TABLES_SQL = `
  CREATE TABLE IF NOT EXISTS conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'New Chat',
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_conversations_createdAt
    ON conversations(createdAt DESC);

  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    conversationId TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
    text TEXT NOT NULL DEFAULT '',
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    modelId TEXT,
    FOREIGN KEY (conversationId) REFERENCES conversations(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_messages_conversationId
    ON messages(conversationId, createdAt ASC);

  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    messageId TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('image')),
    localPath TEXT NOT NULL,
    mime TEXT NOT NULL,
    width INTEGER,
    height INTEGER,
    FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_attachments_messageId
    ON attachments(messageId);

  CREATE TABLE IF NOT EXISTS installed_models (
    id TEXT PRIMARY KEY,
    localPath TEXT NOT NULL,
    sizeBytes INTEGER NOT NULL,
    sha256 TEXT NOT NULL,
    installedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS app_state (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

export const MIGRATIONS: Record<number, string> = {
  // Future migrations go here, keyed by version number
  // 2: 'ALTER TABLE messages ADD COLUMN someNewField TEXT;',
};

export const APP_STATE_KEYS = {
  ACTIVE_MODEL_ID: 'activeModelId',
  DB_VERSION: 'dbVersion',
} as const;
