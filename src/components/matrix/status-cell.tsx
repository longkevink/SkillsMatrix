"use client";

import { SKILL_STATUSES, STATUS_COLORS } from "@/src/lib/constants";
import { cn } from "@/src/lib/utils";
import type { SkillStatus } from "@/src/lib/types";

interface StatusCellProps {
    /** Unique key for this cell (e.g. `resourceId:columnId`) */
    cellKey: string;
    /** Current skill status */
    status: SkillStatus;
    /** Whether the cell has attached notes */
    hasNotes: boolean;
    /** Aria-label for the main status button */
    statusAriaLabel: string;
    /** Aria-label for the note button */
    noteAriaLabel: string;
    /** Whether a save is in progress for this cell */
    isSaving: boolean;
    /** Whether editing is allowed */
    editable: boolean;
    /** Whether notes are visible to this role */
    notesVisible: boolean;
    /** Whether the status menu popup is currently open */
    isMenuOpen: boolean;
    /** Called when the status button is clicked to toggle the menu */
    onToggleMenu: (cellKey: string, button: HTMLButtonElement) => void;
    /** Called when a status option is selected */
    onSelectStatus: (status: SkillStatus) => void;
    /** Called when the close-menu backdrop is clicked */
    onCloseMenu: () => void;
    /** Called when the note icon is clicked */
    onOpenNote: () => void;
    /** Resource name (for menu item aria labels) */
    resourceName: string;
    /** Column name (for menu item aria labels) */
    columnName: string;
}

export function StatusCell({
    cellKey,
    status,
    hasNotes,
    statusAriaLabel,
    noteAriaLabel,
    isSaving,
    editable,
    notesVisible,
    isMenuOpen,
    onToggleMenu,
    onSelectStatus,
    onCloseMenu,
    onOpenNote,
    resourceName,
    columnName,
}: StatusCellProps) {
    const showNoteIcon =
        notesVisible && (hasNotes || editable);

    return (
        <td className="border-b-2 border-r-2 border-slate-950 p-0 align-top">
            <div className="group relative h-full w-full">
                <button
                    type="button"
                    disabled={!editable || isSaving}
                    aria-label={statusAriaLabel}
                    onClick={(event) => {
                        onToggleMenu(cellKey, event.currentTarget);
                    }}
                    className={cn(
                        "relative flex min-h-[48px] w-full cursor-pointer items-center justify-center p-2 text-center transition-all focus-visible:outline-none focus-visible:ring-inset focus-visible:ring-4 focus-visible:ring-white/50",
                        STATUS_COLORS[status],
                        !editable && "cursor-default opacity-90",
                        isSaving && "cursor-wait opacity-80"
                    )}
                >
                    <div className="flex flex-col items-center justify-center">
                        <span className="text-[12px] font-black uppercase tracking-tighter leading-tight drop-shadow-sm">
                            {status === "Red" ? null : status}
                        </span>
                        {isSaving && (
                            <span className="mt-1 text-[10px] font-black uppercase text-white/80 animate-pulse">
                                Saving...
                            </span>
                        )}
                    </div>
                </button>

                {showNoteIcon ? (
                    <button
                        type="button"
                        aria-label={noteAriaLabel}
                        disabled={!hasNotes && !editable}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onOpenNote();
                        }}
                        className={cn(
                            "absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-slate-800 bg-slate-900/85 text-white shadow-sm backdrop-blur-sm",
                            !hasNotes &&
                            editable &&
                            "opacity-0 transition-opacity duration-200 group-hover:opacity-100",
                            !hasNotes && !editable && "pointer-events-none opacity-0"
                        )}
                        title={hasNotes ? "View Note" : "Add Note"}
                    >
                        <span className="text-[10px] font-bold italic">i</span>
                    </button>
                ) : null}

                {isMenuOpen && (
                    <div
                        role="menu"
                        className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                        onClick={() => {
                            onCloseMenu();
                        }}
                    >
                        <div
                            className="w-[92%] max-w-[168px] rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-1)] p-2 shadow-[0_20px_30px_-18px_rgba(15,23,42,0.65)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="mb-2 border-b border-[color:var(--border-subtle)] pb-1 text-center text-[10px] font-black uppercase tracking-tighter text-[color:var(--text-muted)]">
                                Update Status
                            </div>
                            {SKILL_STATUSES.map((statusOption) => (
                                <button
                                    key={statusOption}
                                    type="button"
                                    role="menuitem"
                                    aria-label={`Set ${resourceName} on ${columnName} to ${statusOption}`}
                                    onClick={() => onSelectStatus(statusOption)}
                                    className={cn(
                                        "mb-1 flex w-full cursor-pointer items-center justify-center rounded-lg px-3 py-2.5 text-center text-[12px] font-black uppercase tracking-widest transition-colors",
                                        statusOption === status
                                            ? "bg-[color:var(--accent)] text-white shadow-sm"
                                            : "text-[color:var(--text-strong)] hover:bg-[color:var(--surface-2)]"
                                    )}
                                >
                                    {statusOption}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </td>
    );
}
