"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { FloatingChatWindow } from "@/src/components/chat/floating-chat-window";
import type { ChatMessage } from "@/src/lib/chat/types";

interface OpenChatOptions {
  initialPrompt?: string;
}

interface ChatWindowContextValue {
  isOpen: boolean;
  messages: ChatMessage[];
  pending: boolean;
  error: string | null;
  openChat: (options?: OpenChatOptions) => void;
  closeChat: () => void;
  sendMessage: (message: string) => Promise<void>;
}

const ChatWindowContext = createContext<ChatWindowContextValue | null>(null);

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `chat-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function parseJsonResponse(response: Response) {
  try {
    return (await response.json()) as {
      answer?: string;
      error?: string;
      conversationId?: string;
    };
  } catch {
    return {};
  }
}

export function ChatWindowProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState(makeId);

  const sendMessage = useCallback(
    async (message: string) => {
      const trimmed = message.trim();
      if (!trimmed || pending) {
        return;
      }

      const userMessage: ChatMessage = {
        id: makeId(),
        role: "user",
        content: trimmed,
      };

      setIsOpen(true);
      setError(null);
      setPending(true);
      setMessages((previous) => [...previous, userMessage]);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmed,
            conversationId,
          }),
        });

        const payload = await parseJsonResponse(response);

        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to complete this chat request.");
        }

        if (payload.conversationId && payload.conversationId !== conversationId) {
          setConversationId(payload.conversationId);
        }

        const assistantMessage: ChatMessage = {
          id: makeId(),
          role: "assistant",
          content: payload.answer?.trim() || "I could not generate an answer for that request.",
        };

        setMessages((previous) => [...previous, assistantMessage]);
      } catch (requestError) {
        const messageText = requestError instanceof Error ? requestError.message : "Assistant unavailable.";
        setError(messageText);
        setMessages((previous) => [
          ...previous,
          {
            id: makeId(),
            role: "assistant",
            content: "I couldn't complete that request right now. Please try again.",
          },
        ]);
      } finally {
        setPending(false);
      }
    },
    [conversationId, pending]
  );

  const openChat = useCallback(
    (options?: OpenChatOptions) => {
      setIsOpen(true);

      const initialPrompt = options?.initialPrompt?.trim();
      if (initialPrompt) {
        void sendMessage(initialPrompt);
      }
    },
    [sendMessage]
  );

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setError(null);
  }, []);

  const value = useMemo<ChatWindowContextValue>(
    () => ({
      isOpen,
      messages,
      pending,
      error,
      openChat,
      closeChat,
      sendMessage,
    }),
    [isOpen, messages, pending, error, openChat, closeChat, sendMessage]
  );

  return (
    <ChatWindowContext.Provider value={value}>
      {children}
      <FloatingChatWindow
        isOpen={isOpen}
        messages={messages}
        pending={pending}
        error={error}
        onClose={closeChat}
        onSend={sendMessage}
      />
    </ChatWindowContext.Provider>
  );
}

export function useChatWindow() {
  const context = useContext(ChatWindowContext);

  if (!context) {
    throw new Error("useChatWindow must be used within ChatWindowProvider.");
  }

  return context;
}
