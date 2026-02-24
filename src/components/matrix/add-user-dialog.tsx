"use client";

import { useState } from "react";
import { addResourceAction } from "@/src/lib/actions/resources";
import { useMockRole } from "@/src/components/mock-role-provider";
import { canEdit } from "@/src/lib/mock-role";
import { X } from "lucide-react";

interface AddedResource {
    id: string;
    name: string;
    role: string;
    phone?: string;
}

interface AddUserDialogProps {
    defaultRole: string;
    roles: string[];
    onClose: () => void;
    onAdded: (resource: AddedResource) => void;
}

export function AddUserDialog({ defaultRole, roles, onClose, onAdded }: AddUserDialogProps) {
    const { mockRole } = useMockRole();
    const [name, setName] = useState("");
    const [role, setRole] = useState(defaultRole);
    const [phone, setPhone] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
        const result = await addResourceAction({
            name: name.trim(),
            role: role.trim(),
            phone: phone.trim() || undefined,
            mockRole,
        });
        setIsSubmitting(false);

        if (!result.ok) {
            setError(result.error);
        } else {
            onAdded(result.resource);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Dialog */}
            <div
                className="relative w-full max-w-sm rounded-xl border border-slate-200 bg-white shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-user-title"
            >
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <h2 id="add-user-title" className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                        Add New Person
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
                    {!canEdit(mockRole) && (
                        <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-700">
                            Read Only mode cannot add people. Try switching roles.
                        </div>
                    )}

                    {error && (
                        <div className="rounded border border-red-200 bg-red-50 p-2 text-xs font-semibold text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Name
                        </label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                            placeholder="e.g. John Doe"
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="role" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Role
                        </label>
                        <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <option value="" disabled>Select a role...</option>
                            {roles.map((r) => (
                                <option key={r} value={r}>{r}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                            Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <input
                            id="phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
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
                            {isSubmitting ? "Adding..." : "Add Person"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
