"use client";

import { useEffect, useRef } from "react";

interface CellEditorDialogProps {
  open: boolean;
  resourceName: string;
  showName: string;
  notes: string;
  editable: boolean;
  pending: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
}

export function CellEditorDialog({
  open,
  resourceName,
  showName,
  notes,
  editable,
  pending,
  errorMessage,
  onClose,
  onNotesChange,
  onSave,
}: CellEditorDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !dialogRef.current) {
      return;
    }

    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !first || !last) {
        return;
      }

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-3"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="w-full max-w-md rounded-xl border border-[color:var(--border-strong)] bg-[color:var(--surface-1)] p-4 shadow-[0_28px_40px_-24px_rgba(15,23,42,0.7)]"
        role="dialog"
        aria-modal="true"
        aria-label="NOTE"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 border-b border-[color:var(--border-subtle)] pb-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">NOTE</p>
          <p className="text-sm font-semibold text-[color:var(--text-strong)]">{resourceName}</p>
          <p className="text-xs text-[color:var(--text-muted)]">{showName}</p>
        </div>

        <label className="block text-xs font-semibold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
          NOTE
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            rows={5}
            readOnly={!editable}
            placeholder={editable ? "Optional private context" : "No note for this cell"}
            className="mt-1 w-full rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-2.5 py-2 text-sm text-[color:var(--text-strong)] focus:border-[color:var(--border-strong)] focus:bg-[color:var(--surface-1)] focus:outline-none read-only:cursor-default read-only:bg-slate-100"
          />
        </label>

        {errorMessage ? <p className="mt-2 text-xs font-semibold text-red-700">{errorMessage}</p> : null}

        <div className="mt-3 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-[color:var(--border-subtle)] px-3 py-1.5 text-sm font-semibold text-[color:var(--text-strong)] hover:bg-[color:var(--surface-2)]"
            onClick={onClose}
            disabled={pending}
          >
            Close
          </button>
          {editable ? (
            <button
              type="button"
              className="rounded-md border border-[color:var(--accent)] bg-[color:var(--accent)] px-3 py-1.5 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={onSave}
              disabled={pending}
            >
              {pending ? "Saving..." : "Save NOTE"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
