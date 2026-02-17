interface SectionKickerProps {
  label: string;
}

export function SectionKicker({ label }: SectionKickerProps) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--text-muted)]">{label}</p>
  );
}
