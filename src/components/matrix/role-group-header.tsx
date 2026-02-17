"use client";

interface RoleGroupHeaderProps {
    role: string;
    count: number;
    isCollapsed: boolean;
    colSpan: number;
    onToggle: () => void;
}

export function RoleGroupHeader({
    role,
    count,
    isCollapsed,
    colSpan,
    onToggle,
}: RoleGroupHeaderProps) {
    return (
        <tr className="sticky top-[43px] z-10 shadow-sm">
            <td colSpan={colSpan} className="border-b-2 border-slate-950 bg-[#1f344f] px-1 py-1">
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
                    </div>
                    <span className="text-white/80">{isCollapsed ? "+" : "-"}</span>
                </button>
            </td>
        </tr>
    );
}
