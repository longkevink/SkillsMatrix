import { cn } from "@/src/lib/utils";

type StatusTone = "accent" | "success" | "warning" | "danger" | "muted";

interface InlineStatusDotProps {
  tone?: StatusTone;
  label: string;
}

const toneMap: Record<StatusTone, string> = {
  accent: "bg-[color:var(--accent)]",
  success: "bg-[color:var(--success)]",
  warning: "bg-[color:var(--warning)]",
  danger: "bg-[color:var(--danger)]",
  muted: "bg-slate-400",
};

export function InlineStatusDot({ tone = "muted", label }: InlineStatusDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[color:var(--text-muted)]">
      <span aria-hidden className={cn("h-2 w-2 rounded-full", toneMap[tone])} />
      {label}
    </span>
  );
}
