import type { MockRole, SkillStatus } from "./types";

export const SKILL_STATUSES: SkillStatus[] = ["Active", "Refresh", "Training", "NA", "Red"];

export const STATUS_COLORS: Record<SkillStatus, string> = {
  Active: "bg-[#10b981] text-white",
  Refresh: "bg-[#f59e0b] text-white",
  Training: "bg-[#0ea5e9] text-white",
  NA: "bg-slate-200 text-slate-500",
  Red: "bg-[#ef4444] text-white",
};

export const MOCK_ROLES: MockRole[] = ["Read Only", "Manager", "Admin"];

export const MOCK_ROLE_COOKIE_NAME = "skills_manager_mock_role";
