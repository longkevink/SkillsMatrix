import { STATUS_COLORS } from "@/src/lib/constants";
import type { SkillStatus } from "@/src/lib/types";
import { cn } from "@/src/lib/utils";

interface StatusPillProps {
  status: SkillStatus;
  className?: string;
}

export function StatusPill({ status, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex min-w-[62px] items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em]",
        STATUS_COLORS[status],
        className
      )}
    >
      {status}
    </span>
  );
}
