import { GraduationCap, ArrowRight, AlertTriangle } from "lucide-react";
import type { DashboardAnalytics } from "@/src/lib/types";

interface TrainingPipelineWidgetProps {
    analytics: DashboardAnalytics;
}

export function TrainingPipelineWidget({ analytics }: TrainingPipelineWidgetProps) {
    const { trainingPipeline, trainingInsights } = analytics;

    // Group by role for better visual organization
    const grouped = trainingPipeline.reduce((acc, item) => {
        if (!acc[item.role]) acc[item.role] = [];
        acc[item.role].push(item);
        return acc;
    }, {} as Record<string, typeof trainingPipeline>);
    const sortedRoles = Object.keys(grouped).sort();

    const groupedInsights = trainingInsights.reduce((acc, item) => {
        if (!acc[item.role]) acc[item.role] = [];
        acc[item.role].push(item);
        return acc;
    }, {} as Record<string, typeof trainingInsights>);
    const sortedInsightRoles = Object.keys(groupedInsights).sort();

    return (
        <div className="flex h-full max-h-[500px] xl:max-h-[600px] flex-col overflow-hidden rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] shadow-[0_12px_24px_-18px_rgba(15,23,42,0.45)]" data-testid="training-pipeline">
            <div className="flex items-center justify-between border-b border-[color:var(--border-subtle)] px-4 py-2.5 bg-[color:var(--surface-2)]/40">
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-amber-500" />
                    <h3 className="text-xs font-bold text-[color:var(--text-strong)]">Training Pipeline</h3>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                    {trainingPipeline.length} Active
                </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
                {trainingPipeline.length === 0 && trainingInsights.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-[10px] font-medium text-[color:var(--text-muted)]">
                        No active training assignments or recommendations.
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Recommended Training Insights */}
                        {sortedInsightRoles.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-1.5 pb-1 border-b border-rose-100 dark:border-rose-900/30">
                                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-rose-600 dark:text-rose-400">
                                        Recommended Training
                                    </h4>
                                </div>
                                <div className="space-y-4">
                                    {sortedInsightRoles.map((role) => (
                                        <div key={`insight-${role}`} className="space-y-1.5">
                                            <h5 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                                                {role}
                                            </h5>
                                            <div className="space-y-1.5">
                                                {groupedInsights[role].map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between rounded-lg border border-rose-200/50 bg-rose-50/30 px-2.5 py-1.5 transition-all duration-300 hover:translate-x-1 hover:shadow-md cursor-default">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-6 w-6 items-center justify-center rounded bg-rose-100 text-[10px] font-bold text-rose-700">
                                                                !
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-semibold text-[color:var(--text-strong)] leading-tight">
                                                                    {item.showName}
                                                                </span>
                                                                <span className="text-[9px] font-medium text-rose-500 leading-tight">
                                                                    {item.reason}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Active Pipeline */}
                        {sortedRoles.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-1.5 pb-1 border-b border-[color:var(--border-subtle)]/50">
                                    <GraduationCap className="h-3.5 w-3.5 text-amber-500" />
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
                                        Active Pipeline
                                    </h4>
                                </div>
                                <div className="space-y-4">
                                    {sortedRoles.map((role) => (
                                        <div key={`active-${role}`} className="space-y-1.5">
                                            <h5 className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                                                {role}
                                            </h5>
                                            <div className="space-y-1.5">
                                                {grouped[role].map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between rounded-lg border border-amber-200/50 bg-amber-50/30 px-2.5 py-1.5 transition-all duration-300 hover:translate-x-1 hover:shadow-md hover:bg-amber-50/60 cursor-default">
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-100 text-[10px] font-bold text-amber-700">
                                                                {item.resourceName.charAt(0)}
                                                            </div>
                                                            <span className="text-xs font-semibold text-[color:var(--text-strong)]">
                                                                {item.resourceName}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-[color:var(--text-muted)] text-right">
                                                            <span className="truncate max-w-[100px]">{item.showName}</span>
                                                            <ArrowRight className="h-3 w-3 text-amber-400" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
