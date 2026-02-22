import type { StatusDistribution } from "@/src/lib/types";

interface StatusDistributionChartProps {
    distribution: StatusDistribution;
}

const segments: Array<{
    key: keyof Omit<StatusDistribution, "total">;
    label: string;
    color: string;
    textColor: string;
}> = [
        { key: "active", label: "Active", color: "#10b981", textColor: "text-emerald-700" },
        { key: "training", label: "Training", color: "#f59e0b", textColor: "text-amber-700" },
        { key: "refresh", label: "Refresh", color: "#3b82f6", textColor: "text-blue-700" },
        { key: "red", label: "Red", color: "#ef4444", textColor: "text-rose-700" },
        { key: "na", label: "N/A", color: "#94a3b8", textColor: "text-slate-600" },
    ];

export function StatusDistributionChart({ distribution }: StatusDistributionChartProps) {
    const total = distribution.total || 1;

    return (
        <div className="space-y-3" data-testid="status-distribution">
            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                Assignment Breakdown
            </h4>

            {/* Stacked horizontal bar */}
            <div className="flex h-8 w-full overflow-hidden rounded-lg shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] ring-1 ring-black/[0.04]">
                {segments.map(({ key, label, color }) => {
                    const value = distribution[key];
                    const pct = (value / total) * 100;
                    if (pct === 0) return null;
                    return (
                        <div
                            key={key}
                            className="group relative flex items-center justify-center transition-all duration-700 ease-out"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                            data-testid={`status-bar-${key}`}
                        >
                            {pct > 12 && (
                                <span className="text-[10px] font-bold text-white drop-shadow-sm">
                                    {Math.round(pct)}%
                                </span>
                            )}
                            {/* Tooltip */}
                            <div className="pointer-events-none absolute -top-9 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                {label}: {value} ({Math.round(pct)}%)
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {segments.map(({ key, label, color, textColor }) => {
                    const value = distribution[key];
                    if (value === 0) return null;
                    return (
                        <div key={key} className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-sm shadow-sm" style={{ backgroundColor: color }} />
                            <span className={`text-[11px] font-semibold ${textColor}`}>
                                {label}
                            </span>
                            <span className="text-[11px] font-bold text-[color:var(--text-strong)]">
                                {value}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
