import Link from "next/link";
import { ChevronRight, UserPlus, Users, AlertTriangle, Shield } from "lucide-react";
import type { BackfillPageData } from "@/src/lib/types";

interface BackfillWidgetProps {
    data: BackfillPageData | null;
}

export function BackfillWidget({ data }: BackfillWidgetProps) {
    if (!data) {
        return (
            <div className="flex h-full flex-col rounded-xl bg-[color:var(--surface-1)] border border-[color:var(--border-subtle)] overflow-hidden">
                <div className="flex-1 flex items-center justify-center text-[color:var(--text-muted)]">Loading Data...</div>
            </div>
        );
    }

    const { selectedShow, roles } = data;

    const gaps = roles.filter((r) => {
        const activePermanent = r.permanentCrew.filter((c) => c.status === "Active");
        return activePermanent.length === 0;
    });

    const strongRoles = [...roles]
        .sort((a, b) => {
            const aActive = a.backupList.filter((c) => c.status === "Active").length;
            const bActive = b.backupList.filter((c) => c.status === "Active").length;
            return bActive - aActive;
        })
        .slice(0, 4);

    const totalBackups = roles.reduce((sum, r) => sum + r.backupList.length, 0);
    const activeBackups = roles.reduce((sum, r) => sum + r.backupList.filter((c) => c.status === "Active").length, 0);
    const backupReadiness = totalBackups > 0 ? Math.round((activeBackups / totalBackups) * 100) : 0;

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] shadow-[0_12px_24px_-18px_rgba(15,23,42,0.45)]">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-4 py-2.5 bg-[color:var(--surface-2)]/40">
                <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-[color:var(--accent)]" />
                    <div>
                        <h3 className="text-xs font-bold text-[color:var(--text-strong)]">Backfill Intel</h3>
                        <p className="text-[10px] text-[color:var(--text-muted)]">{selectedShow.name}</p>
                    </div>
                </div>
                <Link
                    href={`/backfill/${selectedShow.id}`}
                    className="flex items-center gap-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--accent)] transition-colors hover:brightness-110"
                >
                    Manage <ChevronRight className="h-3 w-3" />
                </Link>
            </div>

            <div className="flex-1 space-y-3 p-3">
                {/* Summary strip */}
                <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)]/50 px-2.5 py-2 text-center">
                        <span className="text-lg font-extrabold text-rose-600">{gaps.length}</span>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">Gaps</p>
                    </div>
                    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)]/50 px-2.5 py-2 text-center">
                        <span className="text-lg font-extrabold text-emerald-600">{activeBackups}</span>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">Ready</p>
                    </div>
                    <div className="rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)]/50 px-2.5 py-2 text-center">
                        <span className="text-lg font-extrabold text-[color:var(--accent)]">{backupReadiness}%</span>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">Fill Rate</p>
                    </div>
                </div>

                {/* Vacancies */}
                {gaps.length > 0 && (
                    <div className="space-y-1.5">
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-600">
                            <AlertTriangle className="inline h-3 w-3 mr-1" />
                            Unfilled Positions
                        </h4>
                        {gaps.slice(0, 3).map((gap, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between rounded-lg border border-rose-200 bg-rose-50/60 px-2.5 py-1.5"
                            >
                                <div className="flex items-center gap-2">
                                    <UserPlus className="h-3.5 w-3.5 text-rose-500" />
                                    <div>
                                        <span className="text-xs font-bold text-slate-800">{gap.role}</span>
                                        <span className="ml-1.5 text-[10px] text-rose-600">
                                            {gap.permanentCrew.length === 0 ? "No crew" : "Inactive"}
                                        </span>
                                    </div>
                                </div>
                                <Link
                                    href={`/backfill/${selectedShow.id}?role=${gap.role}`}
                                    className="rounded border border-rose-200 bg-white px-2 py-0.5 text-[10px] font-bold text-rose-600 transition-colors hover:bg-rose-50"
                                >
                                    Fill
                                </Link>
                            </div>
                        ))}
                        {gaps.length > 3 && (
                            <p className="text-center text-[10px] text-[color:var(--text-muted)]">
                                +{gaps.length - 3} more
                            </p>
                        )}
                    </div>
                )}

                {/* Talent pool depth  */}
                <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                        Talent Pool Depth
                    </h4>
                    {strongRoles.map((role, idx) => {
                        const total = role.backupList.length;
                        const active = role.backupList.filter((c) => c.status === "Active").length;
                        const pct = total > 0 ? Math.round((active / total) * 100) : 0;

                        return (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="w-12 shrink-0 text-[11px] font-bold text-[color:var(--text-strong)]">
                                    {role.role}
                                </span>
                                <div className="flex-1">
                                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="flex w-16 shrink-0 items-center justify-end gap-1">
                                    <Users className="h-3 w-3 text-[color:var(--text-muted)]" />
                                    <span className="text-[11px] font-bold tabular-nums text-[color:var(--text-strong)]">
                                        {active}/{total}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
