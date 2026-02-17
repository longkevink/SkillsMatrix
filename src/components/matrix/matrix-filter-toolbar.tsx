"use client";

import { SKILL_STATUSES } from "@/src/lib/constants";
import { cn } from "@/src/lib/utils";
import type { SkillStatus } from "@/src/lib/types";

export interface ColumnOption {
    id: string;
    label: string;
}

interface MatrixFilterToolbarProps {
    /** Current search string */
    search: string;
    onSearchChange: (value: string) => void;

    /** Column filter (shows or control rooms) */
    columnLabel: string;
    columnAllLabel: string;
    columnValue: string;
    columns: ColumnOption[];
    onColumnChange: (value: string) => void;

    /** Status filter toggles */
    capabilityStatuses: SkillStatus[];
    onToggleCapabilityStatus: (status: SkillStatus) => void;

    /** Role filter pills */
    roles: string[];
    selectedRoles: string[];
    onToggleRole: (role: string) => void;

    /** Count shown beside "members" */
    filteredCount: number;

    /** Premium mode flag */
    premium: boolean;
}

export function MatrixFilterToolbar({
    search,
    onSearchChange,
    columnLabel,
    columnAllLabel,
    columnValue,
    columns,
    onColumnChange,
    capabilityStatuses,
    onToggleCapabilityStatus,
    roles,
    selectedRoles,
    onToggleRole,
    filteredCount,
    premium,
}: MatrixFilterToolbarProps) {
    return (
        <section
            className={cn(
                "rounded-xl border p-3 shadow-sm",
                premium
                    ? "border-[color:var(--border-subtle)] bg-[color:var(--surface-1)]"
                    : "border-slate-200 bg-white"
            )}
        >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-end">
                    <label className="flex w-full flex-col gap-1.5 md:max-w-xs">
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">Search crew</span>
                        <input
                            type="text"
                            value={search}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder="Type a crew name"
                            className="w-full rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-3 py-2 text-sm text-[color:var(--text-strong)] placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--border-strong)] focus:bg-[color:var(--surface-1)] focus:outline-none"
                        />
                    </label>

                    <label className="flex w-full flex-col gap-1.5 md:max-w-xs">
                        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">{columnLabel}</span>
                        <select
                            value={columnValue}
                            onChange={(event) => onColumnChange(event.target.value)}
                            className="w-full rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-3 py-2 text-sm text-[color:var(--text-strong)] focus:border-[color:var(--border-strong)] focus:bg-[color:var(--surface-1)] focus:outline-none"
                        >
                            <option value="">{columnAllLabel}</option>
                            {columns.map((col) => (
                                <option key={col.id} value={col.id}>
                                    {col.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
                        Status filter
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {SKILL_STATUSES.map((status) => (
                            <button
                                key={status}
                                type="button"
                                onClick={() => onToggleCapabilityStatus(status)}
                                className={cn(
                                    "cursor-pointer rounded-md border px-2.5 py-1 text-xs font-semibold transition",
                                    capabilityStatuses.includes(status)
                                        ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                                        : "border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] text-[color:var(--text-muted)] hover:border-[color:var(--border-strong)]"
                                )}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 border-t border-[color:var(--border-subtle)] pt-3">
                <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">Roles</span>
                    <span className="text-xs font-medium text-[color:var(--text-muted)]">{filteredCount} members</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {roles.map((role) => (
                        <button
                            key={role}
                            type="button"
                            onClick={() => onToggleRole(role)}
                            className={cn(
                                "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition",
                                selectedRoles.includes(role)
                                    ? "border-[color:var(--accent)] bg-[color:var(--accent-soft)] text-[color:var(--text-strong)]"
                                    : "border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] text-[color:var(--text-muted)] hover:border-[color:var(--border-strong)]"
                            )}
                        >
                            {role}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
