import type { DashboardResource, SkillStatus } from "./types";

/**
 * Groups resources by their role and sorts alphabetically.
 */
export function groupByRole(resources: DashboardResource[]) {
    const grouped = new Map<string, DashboardResource[]>();

    for (const resource of resources) {
        const roleBucket = grouped.get(resource.role) ?? [];
        roleBucket.push(resource);
        grouped.set(resource.role, roleBucket);
    }

    return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b));
}

/**
 * Retrieves the skill status for a given resource and column (show or control room).
 * `mode` selects which skill map to read from.
 */
export function getCellSkill(
    resource: DashboardResource,
    columnId: string,
    mode: "shows" | "controlRooms"
): { status: SkillStatus; notes: string | null } {
    const map = mode === "controlRooms" ? resource.controlRoomSkills : resource.skills;
    return map[columnId] ?? { status: "NA" as SkillStatus, notes: null };
}
