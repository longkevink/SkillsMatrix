import type {
    BackfillPageData,
    DashboardAnalytics,
    DashboardData,
    HeatmapCell,
    RoleRiskRow,
    SkillStatus,
    StatusDistribution,
    TrainingPipelineItem,
    TrainingInsight,
} from "@/src/lib/types";

/* ── Thresholds (same source of truth used in executive.ts) ── */

const ROLE_MIN_ACTIVE: Record<string, number> = {
    A1: 2,
    TD: 3,
};

function targetForRole(role: string): number {
    const upper = role.toUpperCase();
    if (upper.includes("A1") || upper === "AUDIO 1") return ROLE_MIN_ACTIVE.A1;
    if (upper.includes("TD") || upper === "TECHNICAL DIRECTOR") return ROLE_MIN_ACTIVE.TD;
    return 2;
}

/* ── Builder ── */

export function buildDashboardAnalytics(
    dashboardData: DashboardData | null,
    backfillData: BackfillPageData | null
): DashboardAnalytics | null {
    if (!dashboardData) return null;

    const { shows, resources } = dashboardData;

    // ── 1. Status distribution ──
    const dist: StatusDistribution = { active: 0, training: 0, refresh: 0, na: 0, red: 0, total: 0 };

    const roleBuckets = new Map<string, { active: number; training: number }>();
    const heatBuckets = new Map<string, { active: number; training: number; refresh: number; na: number; red: number }>();
    const trainingPipeline: TrainingPipelineItem[] = [];

    const allRoles = new Set<string>();

    for (const resource of resources) {
        allRoles.add(resource.role);

        if (!roleBuckets.has(resource.role)) {
            roleBuckets.set(resource.role, { active: 0, training: 0 });
        }

        const allSkills: Array<[string, { status: SkillStatus }]> = [
            ...Object.entries(resource.skills),
            ...Object.entries(resource.controlRoomSkills),
        ];

        for (const [entityId, skill] of allSkills) {
            dist.total += 1;

            switch (skill.status) {
                case "Active":
                    dist.active += 1;
                    roleBuckets.get(resource.role)!.active += 1;
                    break;
                case "Training":
                    dist.training += 1;
                    roleBuckets.get(resource.role)!.training += 1;
                    const showName = shows.find(s => s.id === entityId)?.name || "Control Room";
                    trainingPipeline.push({
                        resourceName: resource.name,
                        role: resource.role,
                        showName,
                        status: skill.status,
                    });
                    break;
                case "Refresh":
                    dist.refresh += 1;
                    break;
                case "NA":
                    dist.na += 1;
                    break;
                case "Red":
                    dist.red += 1;
                    break;
            }

            // Heatmap bucket: show × role
            // Only track show skills for the heatmap (not control room skills)
            const isShowSkill = shows.some((s) => s.id === entityId);
            if (isShowSkill) {
                const key = `${entityId}::${resource.role}`;
                if (!heatBuckets.has(key)) {
                    heatBuckets.set(key, { active: 0, training: 0, refresh: 0, na: 0, red: 0 });
                }
                const bucket = heatBuckets.get(key)!;
                switch (skill.status) {
                    case "Active": bucket.active += 1; break;
                    case "Training": bucket.training += 1; break;
                    case "Refresh": bucket.refresh += 1; break;
                    case "NA": bucket.na += 1; break;
                    case "Red": bucket.red += 1; break;
                }
            }
        }
    }

    // ── 2. Coverage score ──
    const coverageDenom = dist.active + dist.training + dist.refresh + dist.red;
    const coverageScore = coverageDenom === 0 ? 0 : Math.round((dist.active / coverageDenom) * 100);

    // ── 3. Role risk rows ──
    const roleRisks: RoleRiskRow[] = [...roleBuckets.entries()]
        .map(([role, stats]) => {
            const target = targetForRole(role);
            const deficit = Math.max(target - stats.active, 0);
            const severity: RoleRiskRow["severity"] =
                deficit === 0 ? "ok" : stats.active === 0 ? "critical" : "warning";
            return { role, activeCount: stats.active, trainingCount: stats.training, target, deficit, severity };
        })
        .sort((a, b) => b.deficit - a.deficit || a.role.localeCompare(b.role));

    // ── 4. Heatmap cells ──
    const showMap = new Map(shows.map((s) => [s.id, s.name]));
    const sortedRoles = [...allRoles].sort();

    const heatmapData: HeatmapCell[] = [];

    for (const show of shows) {
        for (const role of sortedRoles) {
            const key = `${show.id}::${role}`;
            const bucket = heatBuckets.get(key);

            let dominantStatus: SkillStatus = "NA";
            let active = 0;
            let training = 0;
            let total = 0;

            if (bucket && (bucket.active > 0 || bucket.training > 0 || bucket.refresh > 0 || bucket.na > 0 || bucket.red > 0)) {
                active = bucket.active;
                training = bucket.training;
                total = bucket.active + bucket.training + bucket.refresh + bucket.na + bucket.red;

                // Health-based dominant status
                if (active === 0) {
                    // Manned role but no active crew = Critical Gap
                    dominantStatus = "Red";
                } else if (training > 0) {
                    // Has active crew but also training ongoing
                    dominantStatus = "Training";
                } else {
                    // Good coverage
                    dominantStatus = "Active";
                }
            }

            heatmapData.push({
                showId: show.id,
                showName: showMap.get(show.id) ?? show.id,
                role,
                dominantStatus,
                active,
                training,
                total,
            });
        }
    }

    // ── 5. Backfill metrics ──
    const openBackfillGaps =
        backfillData?.roles.filter(
            (role) => role.permanentCrew.filter((e) => e.status === "Active").length === 0
        ).length ?? 0;

    const readyBackfills =
        backfillData?.roles.reduce(
            (total, role) => total + role.backupList.filter((e) => e.status === "Active").length,
            0
        ) ?? 0;

    // Count unique control rooms from CR skills across all resources
    const crIds = new Set<string>();
    for (const resource of resources) {
        for (const crId of Object.keys(resource.controlRoomSkills)) {
            crIds.add(crId);
        }
    }

    const trainingInsights: TrainingInsight[] = heatmapData
        .filter((cell) => cell.dominantStatus === "Red")
        .map((cell) => ({
            showName: cell.showName,
            role: cell.role,
            reason: "Critical Gap (0 Active)"
        }));

    return {
        totalStaff: resources.length,
        totalShows: shows.length,
        totalControlRooms: crIds.size,
        activeAssignments: dist.active,
        trainingAssignments: dist.training,
        coverageScore,
        openBackfillGaps,
        readyBackfills,
        statusDistribution: dist,
        heatmapData,
        roleRisks,
        trainingPipeline,
        trainingInsights,
        uniqueRoles: sortedRoles,
        uniqueShowNames: shows.map((s) => s.name),
    };
}
