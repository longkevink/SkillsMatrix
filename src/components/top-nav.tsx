"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MOCK_ROLES } from "@/src/lib/constants";
import type { MockRole } from "@/src/lib/types";
import { useMockRole } from "@/src/components/mock-role-provider";
import Image from "next/image";
import { cn } from "@/src/lib/utils";

export function TopNav() {
  const pathname = usePathname();
  const { mockRole, setMockRole } = useMockRole();

  const tabs = [
    { name: "Dashboard", href: "/", isActive: pathname === "/" },
    { name: "Matrix", href: "/matrix", isActive: pathname.startsWith("/matrix") || pathname.startsWith("/skills") },
    { name: "Backfill", href: "/backfill", isActive: pathname.startsWith("/backfill") },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#041428] shadow-md border-b border-white/10 h-14">
      <div className="mx-auto flex w-full max-w-[1800px] h-full flex-wrap items-center justify-between px-4 md:px-6 py-0">

        <div className="flex items-center gap-6 h-full">
          <div className="flex items-center gap-3">
            <Image
              src="/nbc-peacock-white.png"
              alt="NBC Peacock"
              width={100}
              height={65}
              className="h-8 w-auto shrink-0 transition-transform duration-300 hover:scale-105"
            />
            <div className="text-lg font-extrabold tracking-[0.14em] text-white whitespace-nowrap pt-1">
              SKILLS MANAGER
            </div>
          </div>

          <div className="hidden h-5 w-px bg-white/20 md:block" />

          <nav className="relative flex items-center gap-1 h-full pt-1">
            {tabs.map((tab) => (
              <Link
                key={tab.name}
                href={tab.href}
                className={cn(
                  "relative rounded-md px-4 py-1.5 text-[13px] font-bold transition-all duration-200 tracking-wide",
                  tab.isActive
                    ? "text-white"
                    : "text-white/70 hover:text-white"
                )}
              >
                {tab.isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-md bg-[#341280] border border-white shadow-sm -z-10"
                    transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                  />
                )}
                <span className="relative z-10">{tab.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-white/50">
            Access Context
            <select
              value={mockRole}
              onChange={(event) => setMockRole(event.target.value as MockRole)}
              className="rounded-full border border-white/20 bg-[#041428] px-3 py-1.5 text-xs font-bold text-white shadow-sm outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors"
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
