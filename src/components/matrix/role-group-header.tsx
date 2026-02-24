"use client";

interface RoleGroupHeaderProps {
    role: string;
    count: number;
    isCollapsed: boolean;
    colSpan: number;
    onToggle: () => void;
    onAddResource?: (role: string) => void;
}

export function RoleGroupHeader({
    role,
    count,
    isCollapsed,
    colSpan,
    onToggle,
    onAddResource,
}: RoleGroupHeaderProps) {
    return (
        <tr>
            <td
                colSpan={colSpan}
                className="sticky top-[42px] z-[15] border-b-2 border-slate-950 bg-[#1f344f] px-1 py-1 shadow-sm"
            >
                <div className="flex items-center justify-between gap-2">
                    <button
                        type="button"
                        onClick={onToggle}
                        className="flex flex-1 cursor-pointer items-center justify-between rounded px-3 py-1.5 text-left hover:bg-white/10"
                        aria-label={`Toggle ${role} group`}
                    >
                        <span className="flex items-center gap-2">
                            <span className="font-bold uppercase tracking-[0.12em] text-white">{role}</span>
                            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white">
                                {count}
                            </span>
                        </span>
                        <span className="text-white/80">{isCollapsed ? "+" : "-"}</span>
                    </button>
                    {onAddResource ? (
                        <button
                            type="button"
                            onClick={() => onAddResource(role)}
                            className="mr-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25"
                            aria-label={`Add person to ${role}`}
                        >
                            <span className="text-sm font-bold leading-none">+</span>
                        </button>
                    ) : null}
                </div>
            </td>
        </tr>
    );
}
