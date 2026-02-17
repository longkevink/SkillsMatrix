"use client";

import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/src/lib/utils";

export interface DroppableContainerProps {
    id: "permanent" | "backup";
    title: string;
    count: number;
    emptyMessage: string;
    isFilteredEmpty: boolean;
    children: React.ReactNode;
}

export function DroppableContainer({
    id,
    title,
    count,
    emptyMessage,
    isFilteredEmpty,
    children,
}: DroppableContainerProps) {
    const { setNodeRef, isOver } = useDroppable({ id });

    return (
        <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] p-3">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">{title}</h2>
                <span className="rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-2 py-0.5 text-[11px] font-semibold text-[color:var(--text-muted)]">
                    {count}
                </span>
            </div>

            <div
                ref={setNodeRef}
                id={id}
                className={cn(
                    "min-h-[240px] rounded-lg border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-1)] p-2 transition-colors",
                    isOver && "border-[color:var(--accent)] bg-[color:var(--accent-soft)]"
                )}
            >
                {count === 0 ? (
                    <p className="px-2 py-3 text-xs text-[color:var(--text-muted)]">{emptyMessage}</p>
                ) : isFilteredEmpty ? (
                    <p className="px-2 py-3 text-xs text-[color:var(--text-muted)]">No matches for this search.</p>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}
