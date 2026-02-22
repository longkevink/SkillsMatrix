import type { DashboardAnalytics } from "@/src/lib/types";
import { Activity, Users, GraduationCap, Shield, AlertTriangle, UserCheck } from "lucide-react";

interface KpiStripProps {
    analytics: DashboardAnalytics;
}

const kpis = [
    {
        key: "totalStaff",
        label: "Total Staff",
        icon: Users,
        tone: "accent" as const,
        getValue: (a: DashboardAnalytics) => a.totalStaff,
        getHint: (a: DashboardAnalytics) => `${a.totalShows} shows · ${a.totalControlRooms} CRs`,
    },
    {
        key: "active",
        label: "Active",
        icon: Activity,
        tone: "success" as const,
        getValue: (a: DashboardAnalytics) => a.activeAssignments,
        getHint: (a: DashboardAnalytics) => `${Math.round((a.activeAssignments / Math.max(a.statusDistribution.total, 1)) * 100)}% of assignments`,
    },
    {
        key: "training",
        label: "In Training",
        icon: GraduationCap,
        tone: "warning" as const,
        getValue: (a: DashboardAnalytics) => a.trainingAssignments,
        getHint: () => `Pipeline depth`,
    },
    {
        key: "coverage",
        label: "Coverage",
        icon: Shield,
        tone: "accent" as const,
        getValue: (a: DashboardAnalytics) => `${a.coverageScore}%`,
        getHint: () => "Active / assignable",
    },
    {
        key: "gaps",
        label: "Open Gaps",
        icon: AlertTriangle,
        tone: "danger" as const,
        getValue: (a: DashboardAnalytics) => a.openBackfillGaps,
        getHint: () => "Unfilled positions",
    },
    {
        key: "backfills",
        label: "Ready Backfills",
        icon: UserCheck,
        tone: "success" as const,
        getValue: (a: DashboardAnalytics) => a.readyBackfills,
        getHint: () => "Backup active",
    },
];

const toneColors: Record<string, { border: string; bg: string; icon: string; glow: string }> = {
    accent: {
        border: "border-[color:color-mix(in_srgb,var(--accent)_30%,var(--surface-2))]",
        bg: "bg-[color:color-mix(in_srgb,var(--accent)_8%,var(--surface-1))]",
        icon: "text-[color:var(--accent)]",
        glow: "shadow-[0_0_20px_-6px_color-mix(in_srgb,var(--accent)_25%,transparent)]",
    },
    success: {
        border: "border-emerald-200",
        bg: "bg-emerald-50/60",
        icon: "text-emerald-600",
        glow: "shadow-[0_0_20px_-6px_rgba(16,185,129,0.2)]",
    },
    warning: {
        border: "border-amber-200",
        bg: "bg-amber-50/60",
        icon: "text-amber-600",
        glow: "shadow-[0_0_20px_-6px_rgba(245,158,11,0.2)]",
    },
    danger: {
        border: "border-rose-200",
        bg: "bg-rose-50/60",
        icon: "text-rose-600",
        glow: "shadow-[0_0_20px_-6px_rgba(244,63,94,0.2)]",
    },
};

export function KpiStrip({ analytics }: KpiStripProps) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6" data-testid="kpi-strip">
            {kpis.map((kpi) => {
                const Icon = kpi.icon;
                const colors = toneColors[kpi.tone];
                return (
                    <div
                        key={kpi.key}
                        data-testid={`kpi-${kpi.key}`}
                        className={`group relative overflow-hidden rounded-xl border ${colors.border} ${colors.bg} ${colors.glow} p-3.5 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 hover:shadow-xl cursor-default`}
                    >
                        {/* Decorative gradient accent */}
                        <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-[0.07] blur-xl transition-all duration-500 group-hover:scale-[2.5] group-hover:opacity-[0.15]" style={{ background: "currentColor" }} />

                        <div className="flex items-start justify-between">
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
                                    {kpi.label}
                                </p>
                                <p className="mt-1.5 text-2xl font-extrabold leading-none tracking-tight text-[color:var(--text-strong)]">
                                    {kpi.getValue(analytics)}
                                </p>
                                <p className="mt-1 truncate text-[11px] font-medium text-[color:var(--text-muted)] opacity-70">
                                    {kpi.getHint(analytics)}
                                </p>
                            </div>
                            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/50 bg-white/70 ${colors.icon} shadow-sm`}>
                                <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
