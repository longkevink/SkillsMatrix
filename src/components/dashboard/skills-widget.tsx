import Link from "next/link";
import { AlertCircle, ChevronRight, TrendingUp, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { DashboardData } from "@/src/lib/types";

interface SkillsWidgetProps {
    data: DashboardData | null;
}

interface PositionStatusCounts {
    available: number;
    training: number;
    notAssigned: number;
}

export function SkillsWidget({ data }: SkillsWidgetProps) {
    // --- 1. Data Processing Logic ---

    if (!data) {
        return (
            <div className="flex h-full flex-col rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden min-h-[400px]">
                <div className="flex-1 flex items-center justify-center text-slate-400">Loading Data...</div>
            </div>
        );
    }

    const THRESHOLDS = {
        A1: { active: 2, training: 2 },
        TD: { active: 3, training: 3 },
        // Default for others
        DEFAULT: { active: 2, training: 1 },
    };

    const getThresholds = (role: string) => {
        if (role.toUpperCase().includes("A1") || role === "Audio 1") return THRESHOLDS.A1;
        if (role.toUpperCase().includes("TD") || role === "Technical Director") return THRESHOLDS.TD;
        return THRESHOLDS.DEFAULT;
    };

    const showStats = new Map<string, { name: string; roles: Map<string, { active: number; training: number }> }>();

    data.shows.forEach((show) => {
        showStats.set(show.id, { name: show.name, roles: new Map() });
    });

    data.resources.forEach((resource) => {
        // Merge both show skills and control room skills for coverage analysis
        const allSkills = [
            ...Object.entries(resource.skills),
            ...Object.entries(resource.controlRoomSkills)
        ];

        allSkills.forEach(([showOrCrId, skill]) => {
            const showData = showStats.get(showOrCrId);
            // Note: If showOrCrId is a control room, it might not be in showStats if showStats only has shows.
            // But we actually want to know if the person is active in ANY context for the role threshold?
            // Actually, the thresholds seems show-specific in this widget's logic.

            if (!showData) {
                return;
            }

            const role = resource.role;
            if (!showData.roles.has(role)) {
                showData.roles.set(role, { active: 0, training: 0 });
            }

            const counts = showData.roles.get(role)!;

            if (skill.status === "Active") {
                counts.active++;
            } else if (skill.status === "Training") {
                counts.training++;
            }
        });
    });

    const alerts: Array<{ type: "critical" | "warning"; title: string; message: string; show: string }> = [];

    showStats.forEach((showData) => {
        showData.roles.forEach((counts, role) => {
            const threshold = getThresholds(role);

            if (counts.active < threshold.active) {
                alerts.push({
                    type: "critical",
                    title: `Low ${role} Coverage`,
                    message: `Only ${counts.active} active ${role}s (Target: ${threshold.active}+)`,
                    show: showData.name,
                });
            } else if (counts.training < threshold.training) {
                alerts.push({
                    type: "warning",
                    title: `Low ${role} Pipeline`,
                    message: `Only ${counts.training} ${role}s in training (Target: ${threshold.training}+)`,
                    show: showData.name,
                });
            }
        });
    });

    alerts.sort((a, b) => {
        if (a.type === b.type) {
            return a.show.localeCompare(b.show);
        }

        return a.type === "critical" ? -1 : 1;
    });

    const topAlerts = alerts.slice(0, 3);
    const totalIssuesCount = alerts.length;

    const positionSnapshot = (() => {
        const counts = new Map<string, PositionStatusCounts>();

        data.resources.forEach((resource) => {
            const role = resource.role || "Unassigned";

            if (!counts.has(role)) {
                counts.set(role, { available: 0, training: 0, notAssigned: 0 });
            }

            const combinedSkills = [
                ...Object.values(resource.skills),
                ...Object.values(resource.controlRoomSkills)
            ];

            combinedSkills.forEach((skill) => {
                const bucket = counts.get(role)!;

                if (skill.status === "Active") {
                    bucket.available += 1;
                } else if (skill.status === "Training") {
                    bucket.training += 1;
                } else if (skill.status === "NA") {
                    bucket.notAssigned += 1;
                }
            });
        });

        return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
    })();

    // --- 2. Render Component ---

    return (
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-[linear-gradient(165deg,var(--surface-1),var(--surface-2))] shadow-[0_16px_30px_-24px_rgba(15,23,42,0.55)]">
            <div className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-4 py-3">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[color:var(--text-strong)]">
                    <span className="flex h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                    Staffing Matrix
                </h3>
                <Link
                    href="/matrix"
                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--accent)]"
                >
                    Full View <ChevronRight className="h-3 w-3" />
                </Link>
            </div>

            <div className="flex-1 space-y-3 px-4 pb-4 pt-3">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">System Alerts</h4>
                        {totalIssuesCount > 0 && (
                            <span className="text-xs font-semibold text-[color:var(--danger)]">{totalIssuesCount} Issues Detected</span>
                        )}
                    </div>

                    {topAlerts.length === 0 ? (
                        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                            <div>
                                <h5 className="text-sm font-bold text-emerald-900">All Systems Nominal</h5>
                                <p className="text-xs text-emerald-700">Staffing levels meet all operational thresholds.</p>
                            </div>
                        </div>
                    ) : (
                        topAlerts.map((alert, idx) => (
                            <div
                                key={idx}
                                className={`rounded-lg border px-3 py-2 ${alert.type === "critical" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"
                                    }`}
                            >
                                <div className="flex items-start gap-2">
                                    {alert.type === "critical" ? (
                                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                                    ) : (
                                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                                    )}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h5 className={`truncate text-sm font-semibold ${alert.type === "critical" ? "text-rose-900" : "text-amber-900"}`}>
                                                {alert.title}
                                            </h5>
                                            <span className="rounded border border-black/5 bg-white/60 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                                                {alert.show}
                                            </span>
                                        </div>
                                        <p className={`mt-0.5 text-xs ${alert.type === "critical" ? "text-rose-700" : "text-amber-700"}`}>
                                            {alert.message}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] p-4 shadow-sm transition-all hover:shadow-md">
                    <div className="mb-6 flex items-center justify-between">
                        <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.25em] text-[color:var(--text-muted)]">Position Snapshot</h4>
                            <p className="mt-0.5 text-xs font-semibold text-[color:var(--text-strong)] opacity-80">Resource Readiness Matrix</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.4)]" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">Ready</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.4)]" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">Training</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                                <span className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">N/A</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {positionSnapshot.map(([role, counts]) => {
                            const total = counts.available + counts.training + counts.notAssigned;
                            const percent = (val: number) => (total > 0 ? (val / total) * 100 : 0);

                            const pReady = percent(counts.available);
                            const pTraining = percent(counts.training);
                            const pNA = percent(counts.notAssigned);

                            const normalizedRole = role.toLowerCase().replace(/\s+/g, "-");

                            return (
                                <div key={role} className="group flex items-center gap-8">
                                    <div className="w-16 shrink-0">
                                        <div className="text-[11px] font-black uppercase tracking-tight text-[color:var(--text-strong)] group-hover:text-[color:var(--accent)] transition-colors">
                                            {role}
                                        </div>
                                        <div className="mt-0.5 text-[10px] font-bold text-[color:var(--text-muted)] opacity-60">
                                            {total} <span className="text-[8px] uppercase tracking-tighter">Total</span>
                                        </div>
                                    </div>

                                    <div className="relative flex-1 py-1">
                                        <div className="flex flex-col gap-0 overflow-hidden rounded-sm bg-slate-50 shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)] ring-1 ring-black/[0.03]">
                                            {/* Ready Bar */}
                                            <div
                                                data-testid={`position-status-${normalizedRole}-available`}
                                                className="h-3 bg-emerald-500 transition-all duration-700 ease-out flex items-center"
                                                style={{ width: `${pReady}%` }}
                                            >
                                                <span className="sr-only">{Math.round(pReady)}%</span>
                                            </div>
                                            {/* Training Bar */}
                                            <div
                                                data-testid={`position-status-${normalizedRole}-training`}
                                                className="h-3 bg-amber-400 transition-all duration-700 ease-out flex items-center"
                                                style={{ width: `${pTraining}%` }}
                                            >
                                                <span className="sr-only">{Math.round(pTraining)}%</span>
                                            </div>
                                            {/* NA Bar */}
                                            <div
                                                data-testid={`position-status-${normalizedRole}-na`}
                                                className="h-3 bg-slate-300 transition-all duration-700 ease-out flex items-center"
                                                style={{ width: `${pNA}%` }}
                                            >
                                                <span className="sr-only">{Math.round(pNA)}%</span>
                                            </div>
                                        </div>

                                        {/* Hover Overlay for Percentages */}
                                        {total > 0 && (
                                            <div className="absolute -top-4 w-full flex justify-between px-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                <span className="text-[8px] font-black tracking-tighter text-emerald-600">{Math.round(pReady)}%</span>
                                                <span className="text-[8px] font-black tracking-tighter text-amber-600">{Math.round(pTraining)}%</span>
                                                <span className="text-[8px] font-black tracking-tighter text-slate-500">{Math.round(pNA)}%</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex w-10 shrink-0 items-center justify-end tabular-nums">
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-black leading-none text-emerald-600 group-hover:scale-110 transition-transform">{counts.available}</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 ml-1 text-slate-300 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
