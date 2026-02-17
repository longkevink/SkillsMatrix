import { cn } from "@/src/lib/utils";

type MetricTone = "neutral" | "accent" | "success" | "warning" | "danger";

interface MetricTileProps {
  label: string;
  value: number | string;
  hint?: string;
  tone?: MetricTone;
}

const toneClass: Record<MetricTone, string> = {
  neutral: "border-[color:var(--border-subtle)]",
  accent: "border-[color:color-mix(in_srgb,var(--accent) 35%,white)]",
  success: "border-[color:color-mix(in_srgb,var(--success) 35%,white)]",
  warning: "border-[color:color-mix(in_srgb,var(--warning) 40%,white)]",
  danger: "border-[color:color-mix(in_srgb,var(--danger) 35%,white)]",
};

export function MetricTile({ label, value, hint, tone = "neutral" }: MetricTileProps) {
  return (
    <div className={cn("rounded-lg border bg-[color:var(--surface-2)] px-3 py-2", toneClass[tone])}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold leading-none text-[color:var(--text-strong)]">{value}</p>
      {hint ? <p className="mt-1 text-xs text-[color:var(--text-muted)]">{hint}</p> : null}
    </div>
  );
}
