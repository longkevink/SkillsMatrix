import Link from "next/link";
import { ChevronRight, UserPlus, Users, AlertTriangle } from "lucide-react";
import type { BackfillPageData } from "@/src/lib/types";

interface BackfillWidgetProps {
    data: BackfillPageData | null;
}

export function BackfillWidget({ data }: BackfillWidgetProps) {
    if (!data) {
        return (
            <div className="flex h-full flex-col rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                <div className="flex-1 flex items-center justify-center text-slate-400">Loading Data...</div>
            </div>
        )
    }

    const { selectedShow, roles } = data;

    // Analysis Logic
    // 1. Identify "Gaps" -> Roles with 0 'Active' permanent crew
    const gaps = roles.filter(r => {
        // A gap exists if there is no permanent crew member who is ACTIVE
        const activePermanent = r.permanentCrew.filter(c => c.status === "Active");
        return activePermanent.length === 0;
    });

    // 2. Identify "Strength" -> Roles with high ACTIVE backup counts
    const strongRoles = [...roles].sort((a, b) => {
        const aActive = a.backupList.filter(c => c.status === "Active").length;
        const bActive = b.backupList.filter(c => c.status === "Active").length;
        return bActive - aActive;
    }).slice(0, 3);


    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-[linear-gradient(165deg,var(--surface-1),var(--surface-2))] shadow-[0_16px_30px_-24px_rgba(15,23,42,0.55)]">
            <div className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-4 py-3">
                <h3 className="text-sm font-semibold text-[color:var(--text-strong)]">
                    {selectedShow.name} <span className="font-normal text-[color:var(--text-muted)]">Backfill Board</span>
                </h3>
                <Link
                    href={`/backfill/${selectedShow.id}`}
                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--accent)]"
                >
                    Manage Backfill <ChevronRight className="h-3 w-3" />
                </Link>
            </div>

            <div className="flex-1 space-y-4 px-4 pb-4 pt-3">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Vacancy Urgency</h4>
                        <span className="text-xs font-semibold text-[color:var(--danger)]">{gaps.length} open gaps</span>
                    </div>

                    {gaps.length === 0 ? (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                            No vacancies detected. Full crew assigned.
                        </div>
                    ) : (
                        <div className="grid gap-2">
                            {gaps.slice(0, 3).map((gap, idx) => {
                                const riskTag = idx === 0 ? "Critical" : idx === 1 ? "High" : "Elevated";
                                return (
                                    <div key={idx} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-rose-200 bg-white text-rose-600">
                                                    <UserPlus className="h-4 w-4" />
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{gap.role}</p>
                                                    <p className="text-xs text-rose-700">
                                                        {gap.permanentCrew.length === 0 ? "Missing Permanent Crew" : "Permanent Crew Inactive"}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="rounded-full border border-rose-300 bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-700">
                                                {riskTag}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between gap-2">
                                            <span className="inline-flex items-center gap-1 text-xs text-[color:var(--text-muted)]">
                                                <AlertTriangle className="h-3.5 w-3.5 text-[color:var(--warning)]" />
                                                Time-to-fill risk: {idx === 0 ? "24h" : idx === 1 ? "48h" : "72h"}
                                            </span>
                                            <Link href={`/backfill/${selectedShow.id}?role=${gap.role}`} className="rounded-md border border-rose-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700">
                                                Find Fill
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                            {gaps.length > 3 && (
                                <div className="text-center text-xs text-[color:var(--text-muted)]">
                                    + {gaps.length - 3} additional vacancies
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">Talent Pool Depth</h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {strongRoles.map((role, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] p-2.5">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-semibold text-[color:var(--text-strong)]">{role.role}</span>
                                </div>
                                <div className="flex items-center gap-1 rounded bg-[color:var(--surface-2)] px-2 py-0.5 text-xs font-semibold text-[color:var(--text-muted)]">
                                    <Users className="h-3 w-3" />
                                    {role.backupList.filter(c => c.status === "Active").length} Ready
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
