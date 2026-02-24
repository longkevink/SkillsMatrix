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
                className="sticky top-[43px] z-10 border-b-2 border-slate-950 bg-[#1f344f] px-1 py-1 shadow-sm"
            >
                <button
                    type="button"
                    onClick={onToggle}
                    className="flex w-full cursor-pointer items-center justify-between rounded px-3 py-1.5 text-left hover:bg-white/10"
                >
                    <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-[0.12em] text-white">{role}</span>
                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white">
                            {count}
                        </span>
                        {onAddResource && (
                            <div
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAddResource(role);
                                }}
                                className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/25 transition-colors"
                            >
                                <span className="text-sm font-bold leading-none">+</span>
                            </div>
                        )}
                    </div>
                    <span className="text-white/80">{isCollapsed ? "+" : "-"}</span>
                </button>
            </td>
        </tr>
    );
}
