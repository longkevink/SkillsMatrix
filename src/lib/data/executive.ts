import type { BackfillPageData, DashboardData, ExecutiveSnapshot } from "@/src/lib/types";

interface RoleCoverage {
  active: number;
  training: number;
}

const ROLE_MIN_ACTIVE = {
  A1: 2,
  TD: 3,
} as const;

function minimumForRole(role: string) {
  if (role.toUpperCase().includes("A1")) {
    return ROLE_MIN_ACTIVE.A1;
  }

  if (role.toUpperCase().includes("TD")) {
    return ROLE_MIN_ACTIVE.TD;
  }

  return 2;
}

export function buildExecutiveSnapshot(
  dashboardData: DashboardData | null,
  backfillData: BackfillPageData | null
): ExecutiveSnapshot | null {
  if (!dashboardData) {
    return null;
  }

  let activeAssignments = 0;
  let trainingAssignments = 0;
  let refreshAssignments = 0;
  let redAssignments = 0;

  const roleCoverage = new Map<string, RoleCoverage>();

  for (const resource of dashboardData.resources) {
    if (!roleCoverage.has(resource.role)) {
      roleCoverage.set(resource.role, { active: 0, training: 0 });
    }

    const allSkills = [...Object.values(resource.skills), ...Object.values(resource.controlRoomSkills)];
    for (const skill of allSkills) {
      if (skill.status === "Active") {
        activeAssignments += 1;
        roleCoverage.get(resource.role)!.active += 1;
      } else if (skill.status === "Training") {
        trainingAssignments += 1;
        roleCoverage.get(resource.role)!.training += 1;
      } else if (skill.status === "Refresh") {
        refreshAssignments += 1;
      } else if (skill.status === "Red") {
        redAssignments += 1;
      }
    }
  }

  const topRiskRoles = [...roleCoverage.entries()]
    .map(([role, stats]) => {
      const minActive = minimumForRole(role);
      const deficit = Math.max(minActive - stats.active, 0);
      return {
        role,
        active: stats.active,
        training: stats.training,
        deficit,
      };
    })
    .filter((role) => role.deficit > 0)
    .sort((a, b) => b.deficit - a.deficit || a.role.localeCompare(b.role))
    .slice(0, 4);

  const openBackfillGaps =
    backfillData?.roles.filter((role) => role.permanentCrew.filter((entry) => entry.status === "Active").length === 0)
      .length ?? 0;

  const readyBackfills =
    backfillData?.roles.reduce(
      (total, role) => total + role.backupList.filter((entry) => entry.status === "Active").length,
      0
    ) ?? 0;

  const coverageDenominator = activeAssignments + trainingAssignments + refreshAssignments + redAssignments;
  const coverageScore = coverageDenominator === 0 ? 0 : Math.round((activeAssignments / coverageDenominator) * 100);

  return {
    totalStaff: dashboardData.resources.length,
    activeAssignments,
    trainingAssignments,
    refreshAssignments,
    redAssignments,
    openBackfillGaps,
    readyBackfills,
    coverageScore,
    criticalCount: redAssignments + openBackfillGaps,
    warningCount: refreshAssignments + trainingAssignments,
    topRiskRoles,
  };
}
