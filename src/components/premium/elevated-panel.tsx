import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "@/src/lib/utils";

interface ElevatedPanelProps extends ComponentPropsWithoutRef<"section"> {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  headerCentered?: boolean;
  contentClassName?: string;
}

export function ElevatedPanel({
  title,
  subtitle,
  action,
  headerCentered = false,
  contentClassName,
  className,
  children,
  ...props
}: ElevatedPanelProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] shadow-[0_14px_30px_-22px_rgba(15,23,42,0.5)]",
        className
      )}
      {...props}
    >
      {title || subtitle || action ? (
        <header
          className={cn(
            "flex gap-3 border-b border-[color:var(--border-subtle)] px-4 py-3",
            headerCentered ? "flex-col items-center text-center" : "items-start justify-between"
          )}
        >
          <div className={cn(headerCentered && "text-center")}>
            {title ? <h3 className="text-sm font-semibold tracking-wide text-[color:var(--text-strong)]">{title}</h3> : null}
            {subtitle ? (
              <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("px-4 py-3", contentClassName)}>{children}</div>
    </section>
  );
}
