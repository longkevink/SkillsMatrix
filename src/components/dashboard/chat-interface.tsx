"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Send, Sparkles, Bot, CalendarDays, Pencil } from "lucide-react";
import type { ExecutiveSnapshot } from "@/src/lib/types";
import { useChatWindow } from "@/src/components/chat/chat-window-provider";

interface ChatInterfaceProps {
  snapshot: ExecutiveSnapshot | null;
}

const quickActions = [
  {
    label: "Best TD Backfill",
    prompt: "Who is the best backfill for Nightly News TD?",
  },
  {
    label: "Approved TDs",
    prompt: "Give me a list of approved TDs for Nightly News.",
  },
  {
    label: "A1 Backfill",
    prompt: "Who is the best backfill for Nightly News A1?",
  },
  {
    label: "TD Contacts",
    prompt: "Give me approved TD phone numbers for Nightly News.",
  },
];

export function ChatInterface({ snapshot }: ChatInterfaceProps) {
  const [showBot, setShowBot] = useState(true);
  const [draft, setDraft] = useState("");
  const { openChat } = useChatWindow();

  useEffect(() => {
    const interval = setInterval(() => {
      setShowBot((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  function launchChat(prompt: string) {
    const trimmed = prompt.trim();
    if (!trimmed) {
      openChat();
      return;
    }

    openChat({ initialPrompt: trimmed });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) {
      return;
    }

    launchChat(draft);
    setDraft("");
  }

  return (
    <div
      className="rounded-xl border border-[color:var(--border-subtle)] bg-[linear-gradient(145deg,var(--surface-1),var(--surface-2))] shadow-[0_12px_24px_-18px_rgba(15,23,42,0.5)]"
      data-testid="ai-assistant"
    >
      <div className="flex flex-col gap-4 px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => openChat()}
            className="flex items-center gap-3 text-left"
            aria-label="Open AI scheduling chat"
          >
            <div className="relative flex h-10 w-10 overflow-hidden items-center justify-center rounded-xl bg-white text-[color:var(--accent)] shadow-inner">
              <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${showBot ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 -rotate-180"}`}
              >
                <Bot className="h-5 w-5" />
              </div>
              <div
                className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${!showBot ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-180"}`}
              >
                <div className="relative">
                  <CalendarDays className="h-5 w-5" />
                  <Pencil className="absolute -bottom-1 -right-1 h-3 w-3 text-[#38bdf8] stroke-[3px]" />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[color:var(--text-strong)]">
                  AI Scheduling Assistant
                </span>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-[color:var(--accent)] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                </span>
              </div>
              {snapshot ? (
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">
                  {snapshot.openBackfillGaps} Gaps · {snapshot.coverageScore}% Cov
                </p>
              ) : null}
            </div>
          </button>

          <div className="hidden flex-wrap gap-2 lg:flex">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => launchChat(action.prompt)}
                className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)]/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-muted)] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:border-[color:var(--accent)] hover:text-[color:var(--text-strong)] hover:shadow-sm active:scale-95"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="relative w-full">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] opacity-50">
            <Sparkles className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask AI Scheduling Assistant about staffing insights, coverage risks, or backfills..."
            className="w-full rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] py-3 pl-10 pr-12 text-sm font-medium text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)]/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-all focus:border-[color:var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_15%,transparent)]"
            aria-label="Open chat with this prompt"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[color:var(--accent)] px-3 py-2 text-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-all hover:bg-[color:var(--text-strong)] active:scale-95 disabled:opacity-60"
            aria-label="Start chat"
            disabled={!draft.trim()}
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
