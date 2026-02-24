"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SkillStatus } from "@/src/lib/types";
import { cn } from "@/src/lib/utils";

export interface SortableResourceItemProps {
    id: string;
    name: string;
    phone?: string;
    status: SkillStatus;
    disabled: boolean;
    contactOpen: boolean;
    onToggleContact: (id: string) => void;
}

export function SortableResourceItem({
    id,
    name,
    phone,
    status,
    disabled,
    contactOpen,
    onToggleContact,
}: SortableResourceItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id,
        disabled,
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <li
            ref={setNodeRef}
            style={style}
            className={cn(
                "group rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-2.5 py-2 text-sm font-medium text-[color:var(--text-strong)] shadow-sm transition-colors",
                isDragging && "border-[color:var(--accent)] bg-[color:var(--accent-soft)] shadow-md"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{name}</span>
                    <span className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-tighter",
                        status === "Active" ? "bg-emerald-100 text-emerald-800" :
                            status === "Training" ? "bg-amber-100 text-amber-800" :
                                status === "Red" ? "bg-rose-100 text-rose-800" :
                                    "bg-slate-100 text-slate-600"
                    )}>
                        {status}
                    </span>
                    <button
                        type="button"
                        aria-label={`Show contact for ${name}`}
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggleContact(id);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] text-[color:var(--text-muted)] transition-colors hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
                            <path
                                fill="currentColor"
                                d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.24-8 5v1h16v-1c0-2.76-3.58-5-8-5Z"
                            />
                        </svg>
                    </button>
                </div>

                <button
                    type="button"
                    aria-label={`Drag ${name}`}
                    disabled={disabled}
                    {...attributes}
                    {...listeners}
                    className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] text-[color:var(--text-muted)] transition-colors hover:border-[color:var(--border-strong)] hover:text-[color:var(--text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus-ring)]",
                        disabled && "cursor-default opacity-60",
                        !disabled && "cursor-grab active:cursor-grabbing"
                    )}
                >
                    <span className="font-mono text-xs">|||</span>
                </button>
            </div>

            {contactOpen ? (
                <div className="mt-2 rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-2.5 py-2 text-xs leading-relaxed text-[color:var(--text-muted)]">
                    <div>
                        <span className="font-semibold text-[color:var(--text-strong)]">Name:</span> {name}
                    </div>
                    <div>
                        <span className="font-semibold text-[color:var(--text-strong)]">Phone:</span> {phone || "No phone on file"}
                    </div>
                </div>
            ) : null}
        </li>
    );
}
