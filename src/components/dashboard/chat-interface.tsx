"use client";

import { Bot, Send } from "lucide-react";
import type { ExecutiveSnapshot } from "@/src/lib/types";
import { CommandCard } from "@/src/components/premium/command-card";

interface ChatInterfaceProps {
  snapshot: ExecutiveSnapshot | null;
}

const quickActions = ["Critical Gaps", "Available Backfills", "Training Pipeline", "At-Risk Roles"];

export function ChatInterface({ snapshot }: ChatInterfaceProps) {
  return (
    <CommandCard
      centered
      kicker="Premium AI Shell"
      title="AI Staffing Assistant"
      summary="Operational guidance shell for roster, coverage, and backfill prioritization."
    >
      <div className="flex w-full flex-col items-center space-y-3 text-center">
        <div className="w-full rounded-xl border border-[color:var(--border-strong)] bg-[linear-gradient(145deg,var(--surface-1),var(--accent-soft))] px-4 py-3 shadow-[0_16px_28px_-22px_rgba(15,23,42,0.8)]">
          <div className="flex flex-col items-center gap-2">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] text-[color:var(--accent)] shadow-sm">
              <Bot className="h-5.5 w-5.5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[color:var(--text-strong)]">Shift Briefing Context</p>
              <p className="text-xs text-[color:var(--text-muted)]">
                {snapshot
                  ? `${snapshot.totalStaff} staff tracked, ${snapshot.openBackfillGaps} open role gaps`
                  : "Data unavailable - assistant shell still available."}
              </p>
            </div>
          </div>
          <div className="mt-2 flex justify-center text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-2 py-0.5 font-semibold text-[color:var(--text-muted)]">
              Status Synced
            </span>
          </div>
        </div>

        <div className="relative w-full">
          <input
            type="text"
            placeholder="Ask: Who is the strongest backfill for TD tonight?"
            className="w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-1)] py-3 pl-3 pr-12 text-sm font-medium text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)] shadow-[0_12px_24px_-20px_rgba(15,23,42,0.8)]"
          />
          <button
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md border border-[color:var(--accent)] bg-[color:var(--accent)] px-2 py-1 text-white shadow-sm"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5">
          {quickActions.map((action) => (
            <button
              key={action}
              className="rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-2.5 py-1 text-xs font-semibold text-[color:var(--text-muted)] shadow-[0_8px_20px_-18px_rgba(15,23,42,0.6)] hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-strong)]"
            >
              {action}
            </button>
          ))}
        </div>
      </div>
    </CommandCard>
  );
}
