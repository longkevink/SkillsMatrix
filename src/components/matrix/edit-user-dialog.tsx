"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { updateResourceAction } from "@/src/lib/actions/resources";
import { useMockRole } from "@/src/components/mock-role-provider";
import { canEdit } from "@/src/lib/mock-role";

interface EditUserDialogProps {
  resourceId: string;
  initialName: string;
  initialRole: string;
  initialPhone?: string;
  roles: string[];
  onClose: () => void;
  onUpdated: (payload: { id: string; name: string; role: string; phone?: string }) => void;
}

export function EditUserDialog({
  resourceId,
  initialName,
  initialRole,
  initialPhone,
  roles,
  onClose,
  onUpdated,
}: EditUserDialogProps) {
  const { mockRole } = useMockRole();
  const [name, setName] = useState(initialName);
  const [role, setRole] = useState(initialRole);
  const [phone, setPhone] = useState(initialPhone ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const roleOptions = [...new Set([initialRole, ...roles])].sort();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (!role.trim()) {
      setError("Role is required.");
      return;
    }

    setIsSubmitting(true);
    const result = await updateResourceAction({
      resourceId,
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim() || undefined,
      mockRole,
    });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onUpdated({
      id: resourceId,
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-user-title"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 id="edit-user-title" className="text-sm font-bold uppercase tracking-widest text-slate-900">
            Edit Person
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
          {!canEdit(mockRole) ? (
            <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-700">
              Read Only mode cannot edit people. Try switching roles.
            </div>
          ) : null}

          {error ? (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-name" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Name
            </label>
            <input
              id="edit-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-role" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Role
            </label>
            <input
              id="edit-role"
              list="edit-role-options"
              type="text"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
            />
            <datalist id="edit-role-options">
              {roleOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="edit-phone" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Phone Number <span className="font-normal text-slate-400">(Optional)</span>
            </label>
            <input
              id="edit-phone"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              disabled={isSubmitting}
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              placeholder="e.g. 555-0123"
            />
          </div>

          <div className="mt-2 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canEdit(mockRole)}
              className="rounded bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
