"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, Minimize2, Send, X } from "lucide-react";
import type { ChatMessage } from "@/src/lib/chat/types";

interface FloatingChatWindowProps {
  isOpen: boolean;
  messages: ChatMessage[];
  pending: boolean;
  error: string | null;
  onClose: () => void;
  onSend: (message: string) => Promise<void> | void;
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap",
          isUser
            ? "bg-[color:var(--accent)] text-white"
            : "border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] text-[color:var(--text-strong)]",
        ].join(" ")}
      >
        {message.content}
      </div>
    </div>
  );
}

export function FloatingChatWindow({
  isOpen,
  messages,
  pending,
  error,
  onClose,
  onSend,
}: FloatingChatWindowProps) {
  const [draft, setDraft] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const desktopTranscriptRef = useRef<HTMLDivElement>(null);
  const mobileTranscriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || isMinimized) {
      return;
    }

    inputRef.current?.focus();
  }, [isOpen, isMinimized]);

  useEffect(() => {
    if (!isOpen || isMinimized) {
      return;
    }

    if (desktopTranscriptRef.current) {
      desktopTranscriptRef.current.scrollTop = desktopTranscriptRef.current.scrollHeight;
    }

    if (mobileTranscriptRef.current) {
      mobileTranscriptRef.current.scrollTop = mobileTranscriptRef.current.scrollHeight;
    }
  }, [isOpen, isMinimized, messages, pending]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const next = draft.trim();
    if (!next || pending) {
      return;
    }

    setDraft("");
    await onSend(next);
  }

  function handleClose() {
    setIsMinimized(false);
    onClose();
  }

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 right-4 z-[80] hidden sm:block">
        {isMinimized ? (
          <button
            type="button"
            className="flex items-center gap-2 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-4 py-2 text-sm font-semibold text-[color:var(--text-strong)] shadow-lg"
            onClick={() => setIsMinimized(false)}
            aria-label="Reopen chat"
          >
            <Bot className="h-4 w-4 text-[color:var(--accent)]" />
            Assistant Chat
          </button>
        ) : (
          <section
            role="dialog"
            aria-modal="false"
            aria-label="AI Scheduling Assistant Chat"
            className="flex h-[540px] w-[390px] flex-col overflow-hidden rounded-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] shadow-[0_24px_42px_-20px_rgba(15,23,42,0.55)]"
          >
            <header className="flex items-center justify-between border-b border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
                  <Bot className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[color:var(--text-strong)]">AI Scheduling Assistant</p>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                    Staffing Chat
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="rounded-md p-1.5 text-[color:var(--text-muted)] hover:bg-[color:var(--surface-2)]"
                  aria-label="Minimize chat"
                >
                  <Minimize2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-md p-1.5 text-[color:var(--text-muted)] hover:bg-[color:var(--surface-2)]"
                  aria-label="Close chat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </header>

            <div ref={desktopTranscriptRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
              {messages.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-3 py-2 text-sm text-[color:var(--text-muted)]">
                  Ask about backfills, approved crew, or staffing coverage.
                </p>
              ) : null}

              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {pending ? (
                <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                  Assistant is thinking...
                </p>
              ) : null}
            </div>

            {error ? (
              <p className="border-t border-[color:var(--border-subtle)] bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                {error}
              </p>
            ) : null}

            <form onSubmit={handleSubmit} className="border-t border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] p-3">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask a staffing question..."
                  className="w-full rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] py-2.5 pl-3 pr-11 text-sm text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)]/70"
                />
                <button
                  type="submit"
                  disabled={pending || !draft.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg bg-[color:var(--accent)] px-2.5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Send chat message"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </form>
          </section>
        )}
      </div>

      <div className="fixed inset-0 z-[80] sm:hidden" role="dialog" aria-modal="true" aria-label="AI Scheduling Assistant Chat">
        <button
          type="button"
          className="absolute inset-0 bg-slate-950/35"
          onClick={handleClose}
          aria-label="Close chat"
        />

        <section className="absolute inset-x-0 bottom-0 flex max-h-[86vh] flex-col overflow-hidden rounded-t-2xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] pb-[env(safe-area-inset-bottom)] shadow-[0_-24px_36px_-18px_rgba(15,23,42,0.5)]">
          <header className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-4 py-3">
            <p className="text-sm font-bold text-[color:var(--text-strong)]">AI Scheduling Assistant</p>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-md p-1.5 text-[color:var(--text-muted)] hover:bg-[color:var(--surface-2)]"
              aria-label="Close chat"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div ref={mobileTranscriptRef} aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-3 py-2 text-sm text-[color:var(--text-muted)]">
                Ask about backfills, approved crew, or staffing coverage.
              </p>
            ) : null}

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {pending ? (
              <p className="text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
                Assistant is thinking...
              </p>
            ) : null}
          </div>

          {error ? <p className="bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}

          <form onSubmit={handleSubmit} className="border-t border-[color:var(--border-subtle)] p-3">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Ask a staffing question..."
                className="w-full rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] py-2.5 pl-3 pr-11 text-sm text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)]/70"
              />
              <button
                type="submit"
                disabled={pending || !draft.trim()}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg bg-[color:var(--accent)] px-2.5 py-2 text-white disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Send chat message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
