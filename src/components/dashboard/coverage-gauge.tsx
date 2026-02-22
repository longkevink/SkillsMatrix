"use client";

import type { DashboardAnalytics } from "@/src/lib/types";

interface CoverageGaugeProps {
    analytics: DashboardAnalytics;
}

export function CoverageGauge({ analytics }: CoverageGaugeProps) {
    const { coverageScore } = analytics;
    const radius = 70;
    const stroke = 10;
    const circumference = 2 * Math.PI * radius;
    const arcLength = circumference * 0.75; // 270-degree arc
    const filledLength = (coverageScore / 100) * arcLength;


    // Color based on score
    const getColor = (score: number) => {
        if (score >= 75) return { stroke: "#10b981", glow: "rgba(16,185,129,0.35)", label: "Strong" };
        if (score >= 50) return { stroke: "#f59e0b", glow: "rgba(245,158,11,0.35)", label: "Moderate" };
        return { stroke: "#ef4444", glow: "rgba(239,68,68,0.35)", label: "At Risk" };
    };

    const color = getColor(coverageScore);

    return (
        <div className="flex flex-col items-center" data-testid="coverage-gauge">
            <div className="relative">
                <svg width="180" height="150" viewBox="0 0 180 160">
                    {/* Background arc */}
                    <circle
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="none"
                        stroke="var(--surface-3)"
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={`${arcLength} ${circumference}`}
                        strokeDashoffset={0}
                        transform="rotate(135 90 90)"
                    />
                    {/* Filled arc */}
                    <circle
                        cx="90"
                        cy="90"
                        r={radius}
                        fill="none"
                        stroke={color.stroke}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={`${filledLength} ${circumference}`}
                        strokeDashoffset={0}
                        transform="rotate(135 90 90)"
                        className="transition-all duration-1000 ease-out"
                        style={{ filter: `drop-shadow(0 0 6px ${color.glow})` }}
                    />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
                    <span className="text-4xl font-black tracking-tight text-[color:var(--text-strong)]">
                        {coverageScore}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                        percent
                    </span>
                </div>
            </div>
            <div className="mt-1 flex items-center gap-1.5">
                <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color.stroke, boxShadow: `0 0 6px ${color.glow}` }}
                />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: color.stroke }}>
                    {color.label}
                </span>
            </div>
        </div>
    );
}
