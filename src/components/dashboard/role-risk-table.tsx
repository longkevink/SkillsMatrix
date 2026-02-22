import type { DashboardAnalytics } from "@/src/lib/types";
import { CheckCircle2, AlertTriangle, AlertCircle } from "lucide-react";

interface RoleRiskTableProps {
    analytics: DashboardAnalytics;
}

const severityConfig = {
    ok: {
        icon: CheckCircle2,
        badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "Covered",
        bar: "bg-emerald-500",
    },
    warning: {
        icon: AlertTriangle,
        badge: "bg-amber-50 text-amber-700 border-amber-200",
        label: "Low",
        bar: "bg-amber-400",
    },
    critical: {
        icon: AlertCircle,
        badge: "bg-rose-50 text-rose-700 border-rose-200",
        label: "Critical",
        bar: "bg-rose-500",
    },
} as const;

export function RoleRiskTable({ analytics }: RoleRiskTableProps) {
    const { roleRisks } = analytics;

    return (
        <div className="space-y-3" data-testid="role-risk-table">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                    Role Risk Analysis
                </h4>
                <span className="text-[10px] font-semibold text-[color:var(--text-muted)]">
                    {roleRisks.filter((r) => r.severity !== "ok").length} roles below target
                </span>
            </div>

            <div className="overflow-hidden rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)]">
                <table className="w-full border-collapse text-sm">
                    <thead>
                        <tr className="bg-[color:var(--surface-2)] text-[10px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
                            <th className="px-3 py-2.5 text-left">Role</th>
                            <th className="px-3 py-2.5 text-center">Active</th>
                            <th className="px-3 py-2.5 text-center">Training</th>
                            <th className="px-3 py-2.5 text-center">Target</th>
                            <th className="px-3 py-2.5 text-center">Deficit</th>
                            <th className="px-3 py-2.5 text-center">Fill Rate</th>
                            <th className="px-3 py-2.5 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[color:var(--border-subtle)]">
                        {roleRisks.map((risk) => {
                            const config = severityConfig[risk.severity];
                            const Icon = config.icon;
                            const fillRate = risk.target > 0 ? Math.min(Math.round((risk.activeCount / risk.target) * 100), 100) : 100;

                            return (
                                <tr key={risk.role} className="group transition-colors hover:bg-[color:var(--surface-2)]/50">
                                    <td className="px-3 py-2.5">
                                        <span className="text-xs font-bold text-[color:var(--text-strong)]">{risk.role}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                        <span className="text-sm font-extrabold tabular-nums text-emerald-600">{risk.activeCount}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                        <span className="text-sm font-semibold tabular-nums text-amber-600">{risk.trainingCount}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                        <span className="text-sm font-semibold tabular-nums text-[color:var(--text-muted)]">{risk.target}</span>
                                    </td>
                                    <td className="px-3 py-2.5 text-center">
                                        {risk.deficit > 0 ? (
                                            <span className="text-sm font-extrabold tabular-nums text-rose-600">-{risk.deficit}</span>
                                        ) : (
                                            <span className="text-sm font-semibold text-emerald-600">✓</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="mx-auto w-16">
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                                <div
                                                    className={`h-full rounded-full ${config.bar} transition-all duration-500`}
                                                    style={{ width: `${fillRate}%` }}
                                                />
                                            </div>
                                            <span className="mt-0.5 block text-center text-[9px] font-bold text-[color:var(--text-muted)]">{fillRate}%</span>
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-right">
                                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${config.badge}`}>
                                            <Icon className="h-3 w-3" />
                                            {config.label}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
