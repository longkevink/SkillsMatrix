"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MOCK_ROLES } from "@/src/lib/constants";
import type { MockRole } from "@/src/lib/types";
import { useMockRole } from "@/src/components/mock-role-provider";
import { cn } from "@/src/lib/utils";

export function TopNav() {
  const pathname = usePathname();
  const { mockRole, setMockRole } = useMockRole();

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--border-subtle)] bg-[color:color-mix(in_srgb,var(--surface-1) 88%,white)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1800px] flex-wrap items-center justify-between gap-3 px-3 py-2 md:px-4">
        <div className="flex items-center gap-3">
          <div className="rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-2.5 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-[color:var(--text-strong)]">
            Skills Manager
          </div>

          <nav className="flex items-center gap-1 rounded-lg border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] p-1">
            <Link
              href="/"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                pathname === "/"
                  ? "bg-[color:var(--surface-1)] text-[color:var(--text-strong)] shadow-sm"
                  : "text-[color:var(--text-muted)] hover:text-[color:var(--text-strong)]"
              )}
            >
              Dashboard
            </Link>
            <Link
              href="/matrix"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                pathname.startsWith("/matrix") || pathname.startsWith("/skills")
                  ? "bg-[color:var(--surface-1)] text-[color:var(--text-strong)] shadow-sm"
                  : "text-[color:var(--text-muted)] hover:text-[color:var(--text-strong)]"
              )}
            >
              Matrix
            </Link>
            <Link
              href="/backfill"
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-semibold transition",
                pathname.startsWith("/backfill")
                  ? "bg-[color:var(--surface-1)] text-[color:var(--text-strong)] shadow-sm"
                  : "text-[color:var(--text-muted)] hover:text-[color:var(--text-strong)]"
              )}
            >
              Backfill
            </Link>
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[color:var(--text-muted)]">
            Access
            <select
              value={mockRole}
              onChange={(event) => setMockRole(event.target.value as MockRole)}
              className="rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-2 py-1.5 text-xs font-semibold text-[color:var(--text-strong)] shadow-sm"
            >
              {MOCK_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </header>
  );
}
