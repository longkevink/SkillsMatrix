import type { ReactNode } from "react";
import { ElevatedPanel } from "@/src/components/premium/elevated-panel";

interface CommandCardProps {
  kicker: string;
  title: string;
  summary: string;
  action?: ReactNode;
  children?: ReactNode;
  centered?: boolean;
}

export function CommandCard({ kicker, title, summary, action, children, centered = false }: CommandCardProps) {
  return (
    <ElevatedPanel
      title={title}
      subtitle={summary}
      action={action}
      headerCentered={centered}
      contentClassName={centered ? "flex flex-col items-center text-center" : undefined}
      className="overflow-hidden bg-[linear-gradient(145deg,var(--surface-1),var(--surface-2))]"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
        {kicker}
      </p>
      {children}
    </ElevatedPanel>
  );
}
