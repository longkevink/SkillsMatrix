import type { ReactNode } from "react";

interface DensityToolbarProps {
  title: string;
  detail?: string;
  children?: ReactNode;
}

export function DensityToolbar({ title, detail, children }: DensityToolbarProps) {
  return (
    <div className="rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-3 py-2 shadow-[0_8px_20px_-18px_rgba(15,23,42,0.5)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{title}</p>
          {detail ? <p className="text-xs text-[color:var(--text-muted)]">{detail}</p> : null}
        </div>
        {children ? <div className="flex flex-wrap items-center gap-1.5">{children}</div> : null}
      </div>
    </div>
  );
}
