// src/ai/types.ts
// Shared TypeScript types for the entire AI layer

export interface ModelCapabilities {
  vision: boolean;
}

export interface InferenceDefaults {
  temperature: number;
  top_p: number;
  max_tokens: number;
  context_length: number;
}

export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  sizeBytes: number;
  url: string;
  sha256: string;
  filename: string;
  capabilities: ModelCapabilities;
  inferenceDefaults: InferenceDefaults;
}

export interface Attachment {
  id: string;
  messageId: string;
  type: 'image';
  localPath: string;
  mime: string;
  width?: number;
  height?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  attachments?: Attachment[];
}

export interface InferenceRequest {
  messages: ChatMessage[];
  model: ModelDefinition;
  systemPrompt?: string;
}

// UI-facing message type (superset of ChatMessage)
export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  attachments?: Attachment[];
  createdAt: number;
  updatedAt: number;
  modelId?: string;
  isStreaming?: boolean; // UI-only flag
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface InstalledModel {
  id: string;
  localPath: string;
  sizeBytes: number;
  sha256: string;
  installedAt: number;
}

export type DownloadProgressCallback = (percent: number) => void;
export type TokenCallback = (token: string) => void;
export type DoneCallback = (fullText: string) => void;
export type ErrorCallback = (error: Error) => void;
