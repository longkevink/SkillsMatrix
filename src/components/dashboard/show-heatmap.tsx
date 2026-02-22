import type { DashboardAnalytics, SkillStatus } from "@/src/lib/types";

interface ShowHeatmapProps {
    analytics: DashboardAnalytics;
}

const statusColors: Record<SkillStatus, { bg: string; ring: string }> = {
    Active: { bg: "bg-emerald-500", ring: "ring-emerald-300" },
    Training: { bg: "bg-amber-400", ring: "ring-amber-200" },
    Refresh: { bg: "bg-blue-400", ring: "ring-blue-200" },
    NA: { bg: "bg-slate-200", ring: "ring-slate-100" },
    Red: { bg: "bg-rose-500", ring: "ring-rose-300" },
};

export function ShowHeatmap({ analytics }: ShowHeatmapProps) {
    const { heatmapData, uniqueRoles, uniqueShowNames } = analytics;

    // Build a lookup: showName → role → cell
    const cellMap = new Map<string, Map<string, (typeof heatmapData)[0]>>();
    for (const cell of heatmapData) {
        if (!cellMap.has(cell.showName)) cellMap.set(cell.showName, new Map());
        cellMap.get(cell.showName)!.set(cell.role, cell);
    }

    return (
        <div className="flex h-full max-h-[500px] xl:max-h-[600px] flex-col overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] shadow-[0_12px_24px_-18px_rgba(15,23,42,0.45)]" data-testid="show-heatmap">
            <div className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-4 py-2.5 bg-[color:var(--surface-2)]/40">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                    Show × Role Coverage
                </h4>
                <div className="flex gap-2">
                    {(["Active", "Training", "Red", "NA"] as SkillStatus[]).map((s) => (
                        <div key={s} className="flex items-center gap-1">
                            <span className={`h-2 w-2 rounded-sm ${statusColors[s].bg}`} />
                            <span className="text-[8px] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">{s}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-[color:var(--surface-1)]">
                <table className="w-full table-fixed border-collapse">
                    <thead>
                        <tr>
                            <th className="sticky top-0 left-0 z-20 bg-[color:var(--surface-2)] px-3 py-2 text-left text-[10px] w-[28%] font-bold uppercase tracking-wider text-[color:var(--text-muted)]">
                                Show
                            </th>
                            {uniqueRoles.map((role) => (
                                <th
                                    key={role}
                                    className="sticky top-0 z-10 bg-[color:var(--surface-2)] px-2 py-2 text-center text-[9px] font-bold uppercase tracking-wider text-[color:var(--text-muted)] truncate"
                                    title={role}
                                >
                                    {role}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {uniqueShowNames.map((showName, rowIdx) => (
                            <tr
                                key={showName}
                                className={rowIdx % 2 === 0 ? "bg-[color:var(--surface-1)]" : "bg-[color:var(--surface-2)]/40"}
                            >
                                <td className="sticky left-0 z-10 bg-inherit px-3 py-1.5 text-xs font-semibold text-[color:var(--text-strong)] whitespace-nowrap">
                                    {showName}
                                </td>
                                {uniqueRoles.map((role) => {
                                    const cell = cellMap.get(showName)?.get(role);
                                    const status = cell?.dominantStatus ?? "NA";
                                    const colors = statusColors[status];
                                    const active = cell?.active ?? 0;
                                    const training = cell?.training ?? 0;

                                    let displayValue = "–";
                                    if (status === "Red") displayValue = "0";
                                    else if (status === "Training") displayValue = `${training}T`;
                                    else if (active > 0) displayValue = `${active}`;

                                    const isCritical = status === "Red";

                                    return (
                                        <td key={role} className="group relative px-2 py-1.5 text-center">
                                            <div className="flex items-center justify-center">
                                                <span
                                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md ${colors.bg} ring-1 ${colors.ring} text-[10px] font-black text-white shadow-sm transition-all duration-300 group-hover:scale-125 group-hover:z-10 group-hover:shadow-md ${isCritical ? "animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.7)]" : ""}`}
                                                >
                                                    {displayValue}
                                                </span>
                                            </div>
                                            {/* Hover tooltip */}
                                            {cell && cell.total > 0 && (
                                                <div className="pointer-events-none absolute -top-8 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                                                    {cell.active}A · {cell.training}T · {cell.total} total
                                                </div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
