// src/hooks/useChat.ts
// Exposes chat state and actions to the Chat UI.
// Calls chat.service only — never AI layer or DB directly.

import { useState, useCallback, useRef } from 'react';
import { chatService } from '../services/chat.service';
import { Message, Conversation } from '../ai/types';

interface ChatState {
  conversation: Conversation | null;
  messages: Message[];
  isStreaming: boolean;
  error: string | null;
}

interface ChatActions {
  startConversation: () => void;
  sendMessage: (text: string) => Promise<void>;
  stopGeneration: () => void;
  clearError: () => void;
}

export function useChat(): ChatState & ChatActions {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track the streaming assistant message ID
  const streamingMsgIdRef = useRef<string | null>(null);

  /** Creates (or resets to) a new conversation */
  const startConversation = useCallback(() => {
    const conv = chatService.createConversation();
    setConversation(conv);
    setMessages([]);
    setError(null);
    streamingMsgIdRef.current = null;
  }, []);

  /** Sends a message and starts streaming the response */
  const sendMessage = useCallback(async (text: string) => {
    if (!conversation) {
      setError('No active conversation. Start a new chat first.');
      return;
    }

    if (isStreaming) {
      return; // Prevent double-sends
    }

    setError(null);
    setIsStreaming(true);

    try {
      // Optimistically add user message to UI immediately
      const tempUserMsg: Message = {
        id: `temp_user_${Date.now()}`,
        conversationId: conversation.id,
        role: 'user',
        text,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Add a streaming placeholder for the assistant
      const tempAssistantMsg: Message = {
        id: `temp_assistant_${Date.now()}`,
        conversationId: conversation.id,
        role: 'assistant',
        text: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, tempUserMsg, tempAssistantMsg]);

      await chatService.sendMessage(
        conversation.id,
        text,
        // onToken — update the streaming message text
        (partialText: string) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === tempAssistantMsg.id
                ? { ...m, text: partialText, isStreaming: true }
                : m,
            ),
          );
        },
        // onDone — finalize the message
        (fullText: string, realMsgId: string) => {
          setMessages(prev =>
            prev.map(m =>
              m.id === tempAssistantMsg.id
                ? { ...m, id: realMsgId, text: fullText, isStreaming: false }
                : m,
            ),
          );
          // Also update the temp user message with its real DB id
          // by reloading from DB
          const dbMessages = chatService.getMessages(conversation.id);
          setMessages(dbMessages);
          setIsStreaming(false);
        },
        // onError
        (err: Error) => {
          setError(err.message);
          setMessages(prev =>
            prev.map(m =>
              m.id === tempAssistantMsg.id
                ? { ...m, isStreaming: false }
                : m,
            ),
          );
          setIsStreaming(false);
        },
      );
    } catch (err) {
      setError(`Failed to send message: ${String(err)}`);
      setIsStreaming(false);
    }
  }, [conversation, isStreaming]);

  /** Cancels the currently running generation */
  const stopGeneration = useCallback(() => {
    chatService.cancelGeneration();
    setIsStreaming(false);
    // Mark the streaming message as done
    setMessages(prev =>
      prev.map(m => m.isStreaming ? { ...m, isStreaming: false } : m),
    );
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return {
    conversation,
    messages,
    isStreaming,
    error,
    startConversation,
    sendMessage,
    stopGeneration,
    clearError,
  };
}
