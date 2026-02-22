"use client";

import { Send, Sparkles, Bot } from "lucide-react";
import type { ExecutiveSnapshot } from "@/src/lib/types";

interface ChatInterfaceProps {
  snapshot: ExecutiveSnapshot | null;
}

const quickActions = ["Critical Gaps", "Available Backfills", "Training Pipeline", "At-Risk Roles", "Shift Summary"];

export function ChatInterface({ snapshot }: ChatInterfaceProps) {
  return (
    <div
      className="rounded-xl border border-[color:var(--border-subtle)] bg-[linear-gradient(145deg,var(--surface-1),var(--surface-2))] shadow-[0_12px_24px_-18px_rgba(15,23,42,0.5)]"
      data-testid="ai-assistant"
    >
      <div className="flex flex-col gap-4 px-5 py-4">
        {/* Top Row: AI Identity & Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--surface-strong)] text-white shadow-inner">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-[color:var(--text-strong)]">AI Scheduling Assistant</span>
                <span className="flex h-2 w-2">
                  <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-[color:var(--accent)] opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                </span>
              </div>
              {snapshot && (
                <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-[color:var(--text-muted)]">
                  {snapshot.openBackfillGaps} Gaps · {snapshot.coverageScore}% Cov
                </p>
              )}
            </div>
          </div>

          {/* Quick actions moved to top row on desktop */}
          <div className="hidden flex-wrap gap-2 lg:flex">
            {quickActions.map((action) => (
              <button
                key={action}
                className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)]/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-muted)] shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:border-[color:var(--accent)] hover:text-[color:var(--text-strong)] hover:shadow-sm active:scale-95"
              >
                {action}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Row: Input */}
        <div className="relative w-full">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)] opacity-50">
            <Sparkles className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Ask AI Scheduling Assistant about staffing insights, coverage risks, or backfills..."
            className="w-full rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] py-3 pl-10 pr-12 text-sm font-medium text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)]/60 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] transition-all focus:border-[color:var(--accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--accent)_15%,transparent)]"
          />
          <button
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[color:var(--surface-strong)] px-3 py-2 text-white shadow-[0_2px_4px_rgba(0,0,0,0.1)] transition-all hover:bg-[color:var(--accent)] active:scale-95"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

    </div>
  );
}
