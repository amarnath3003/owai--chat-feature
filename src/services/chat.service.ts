// src/services/chat.service.ts
// Orchestrates the full chat flow between the UI, DB repos, and AI layer.
// NEVER imports llama.rn directly. All AI goes through ChatInference.

import { conversationsRepo } from '../db/repositories/conversations.repo';
import { messagesRepo } from '../db/repositories/messages.repo';
import { chatInference } from '../ai/ChatInference';
import { modelManager } from '../ai/ModelManager';
import {
  Conversation,
  Message,
  ChatMessage,
} from '../ai/types';

const SYSTEM_PROMPT =
  'You are PocketAI, a helpful, concise, and honest assistant running fully offline on the user\'s device.';

// Debounce interval for writing streaming tokens to DB (ms)
const DB_WRITE_DEBOUNCE_MS = 100;

class ChatService {
  /**
   * Creates a new conversation and returns it.
   */
  createConversation(title?: string): Conversation {
    return conversationsRepo.create(title);
  }

  /**
   * Loads all messages for a conversation from the DB.
   */
  getMessages(conversationId: string): Message[] {
    return messagesRepo.getByConversation(conversationId);
  }

  /**
   * Loads all conversations, ordered by most recently updated.
   */
  getConversations(): Conversation[] {
    return conversationsRepo.getAll();
  }

  /**
   * Sends a user message and starts streaming the assistant response.
   *
   * @param conversationId  The conversation to send into
   * @param text            The user's message text
   * @param onToken         Called with each debounced token batch (for UI update)
   * @param onDone          Called when generation completes with the full response text
   * @param onError         Called if inference fails
   * @returns               The user Message object (saved to DB immediately)
   */
  async sendMessage(
    conversationId: string,
    text: string,
    onToken: (partialText: string) => void,
    onDone: (fullText: string, assistantMsgId: string) => void,
    onError: (error: Error) => void,
  ): Promise<Message> {
    const activeModel = modelManager.getActiveModel();
    if (!activeModel) {
      throw new Error('[ChatService] No active model. Select a model first.');
    }

    // Ensure model is loaded in memory
    await modelManager.loadModelIfNeeded();

    // 1. Save user message to DB immediately
    const userMessage = messagesRepo.create({
      conversationId,
      role: 'user',
      text,
      modelId: activeModel.id,
    });

    // Touch conversation so it moves to top of recents list
    conversationsRepo.touch(conversationId);

    // 2. Create a placeholder assistant message
    const assistantMessage = messagesRepo.create({
      conversationId,
      role: 'assistant',
      text: '',
      modelId: activeModel.id,
    });

    // 3. Build the history for the inference request
    const history = messagesRepo.getByConversation(conversationId);
    const chatHistory: ChatMessage[] = history
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role as 'user' | 'assistant', text: m.text }));

    // 4. Set up debounced DB writes during streaming
    let accumulatedText = '';
    let dbWriteTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleDbWrite = () => {
      if (dbWriteTimer) clearTimeout(dbWriteTimer);
      dbWriteTimer = setTimeout(() => {
        messagesRepo.updateText(assistantMessage.id, accumulatedText);
      }, DB_WRITE_DEBOUNCE_MS);
    };

    // 5. Start inference
    chatInference.start(
      {
        messages: chatHistory,
        model: activeModel,
        systemPrompt: SYSTEM_PROMPT,
      },
      // onToken — update UI immediately, write to DB debounced
      (tokenBatch: string) => {
        accumulatedText += tokenBatch;
        onToken(accumulatedText);
        scheduleDbWrite();
      },
      // onDone — final write to DB, notify caller
      (fullText: string) => {
        if (dbWriteTimer) clearTimeout(dbWriteTimer);
        messagesRepo.updateText(assistantMessage.id, fullText);
        conversationsRepo.touch(conversationId);
        onDone(fullText, assistantMessage.id);
      },
      // onError — clean up
      (error: Error) => {
        if (dbWriteTimer) clearTimeout(dbWriteTimer);
        // Save whatever was generated before the error
        if (accumulatedText) {
          messagesRepo.updateText(assistantMessage.id, accumulatedText + '\n[Error]');
        }
        onError(error);
      },
    );

    return userMessage;
  }

  /**
   * Cancels the currently running generation.
   */
  cancelGeneration(): void {
    chatInference.stop();
  }

  /**
   * Deletes a conversation and all its messages.
   */
  deleteConversation(id: string): void {
    conversationsRepo.delete(id);
  }
}

export const chatService = new ChatService();
