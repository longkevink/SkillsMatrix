import type { DashboardResource, SkillStatus } from "./types";

export interface MatrixFilters {
  selectedRoles: string[];
  search: string;
  capabilityShowId: string | null;
  capabilityStatuses: SkillStatus[];
}

export function filterResources(resources: DashboardResource[], filters: MatrixFilters) {
  const roleSet = new Set(filters.selectedRoles);
  const statusSet = new Set(filters.capabilityStatuses);
  const hasRoleFilter = roleSet.size > 0;
  const normalizedSearch = filters.search.trim().toLowerCase();

  return resources.filter((resource) => {
    if (hasRoleFilter) {
      const resourceRole = (resource.role || "").trim();
      // Check if the resource role matches any of the selected roles (normalized)
      // We iterate because we want to be robust against case/whitespace in the source data too if needed,
      // though typically the UI options come from the data itself.
      // To be safe, we check if the set has the specific role string.
      if (!roleSet.has(resourceRole)) {
        return false;
      }
    }

    if (normalizedSearch && !resource.name.toLowerCase().includes(normalizedSearch)) {
      return false;
    }

    if (statusSet.size > 0) {
      if (filters.capabilityShowId) {
        // Specific show selected
        const skill = resource.skills[filters.capabilityShowId];
        if (!skill || !statusSet.has(skill.status)) {
          return false;
        }
      } else {
        // No specific show selected: Check if ANY show matches the selected statuses
        // We check if the resource has any skill that matches one of the selected statuses
        const skills = Object.values(resource.skills);
        const hasMatchingStatus = skills.some((s) => statusSet.has(s.status));
        if (!hasMatchingStatus) {
          return false;
        }
      }
    }

    return true;
  });
}
