import "server-only";

import { getSupabaseAdminClient } from "@/src/lib/supabase/admin";
import type { SkillStatus } from "@/src/lib/types";

interface ShowRow {
  id: string;
  name: string;
  type: string;
}

interface RoleRow {
  role: string;
}

interface BackfillPreferenceRow {
  resource_id: string;
  rank: number;
  is_permanent_crew: boolean;
}

interface ResourceRow {
  id: string;
  name: string;
  role: string;
  phone: string | null;
}

interface SkillRow {
  resource_id: string;
  status: SkillStatus;
}

interface SkillWithShowRow extends SkillRow {
  show_id: string;
}

export interface ResolvedShow {
  id: string;
  name: string;
  type: string;
}

export interface ResolveShowRoleResult {
  show: ResolvedShow | null;
  role: string | null;
  normalizedShowInput: string | null;
  normalizedRoleInput: string | null;
}

export interface BackfillCandidate {
  resourceId: string;
  name: string;
  role: string;
  rank: number;
  isPermanentCrew: boolean;
  status: SkillStatus | "NA";
  phone?: string;
}

export interface BestBackfillResult {
  show: string | null;
  role: string | null;
  best: BackfillCandidate | null;
  alternatives: BackfillCandidate[];
  reason?: string;
}

export interface ApprovedStaffMember {
  resourceId: string;
  name: string;
  role: string;
  status: "Active";
  phone?: string;
}

export interface ApprovedStaffResult {
  show: string | null;
  role: string | null;
  members: ApprovedStaffMember[];
  reason?: string;
}

export interface ApprovedStaffMultiShowResult {
  shows: string[];
  unresolvedShows: string[];
  role: string | null;
  members: ApprovedStaffMember[];
  reason?: string;
}

export interface RoleCoverageBreakdown {
  role: string;
  active: number;
  training: number;
  refresh: number;
  na: number;
  red: number;
  total: number;
}

export interface RoleCoverageAnalysisResult {
  scope: "single_show" | "all_shows";
  show: string | null;
  roleBreakdown: RoleCoverageBreakdown[];
  leastActiveRoles: RoleCoverageBreakdown[];
  reason?: string;
}

export interface SkillQueryMatch {
  resourceId: string;
  resourceName: string;
  role: string;
  showId: string;
  showName: string;
  status: SkillStatus;
  phone?: string;
}

export interface SkillsQueryResult {
  show: string | null;
  role: string | null;
  status: SkillStatus | null;
  resourceName: string | null;
  matches: SkillQueryMatch[];
  reason?: string;
}

export interface BackfillRecommendation {
  resourceId: string;
  resourceName: string;
  rank: number;
  status: SkillStatus | "NA";
  isPermanentCrew: boolean;
  phone?: string;
}

export interface BackfillInsightRow {
  show: string;
  role: string;
  permanentCount: number;
  permanentActiveCount: number;
  backupCount: number;
  backupActiveCount: number;
  hasGap: boolean;
  recommendedFill: BackfillRecommendation | null;
}

export interface BackfillInsightsResult {
  show: string | null;
  role: string | null;
  insights: BackfillInsightRow[];
  reason?: string;
}

const SHOW_ALIASES: Record<string, string> = {
  nn: "Nightly News",
  "nightly news": "Nightly News",
  nightly: "Nightly News",
  "today show": "Today Show",
  today: "Today Show",
  "4th hour": "4th Hour Today",
  "4th hour today": "4th Hour Today",
};

const ROLE_ALIASES: Record<string, string> = {
  td: "TD",
  "technical director": "TD",
  "technical directors": "TD",
  "audio 1": "A1",
  "audio engineer": "A1",
  a1: "A1",
  a2: "A2",
  "stage manager": "Stage Manager",
  "gfx operator": "GFX Op",
  "gfx op": "GFX Op",
  "video operator": "V1",
  "video engineer": "V1",
  v1: "V1",
};

function normalizeLookupValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function normalizeShowInput(value: string) {
  const normalized = normalizeLookupValue(value);
  return SHOW_ALIASES[normalized] ?? value.trim();
}

export function normalizeRoleInput(value: string) {
  const normalized = normalizeLookupValue(value);
  return ROLE_ALIASES[normalized] ?? value.trim();
}

function resolveShowFromList(shows: ShowRow[], showInput: string) {
  const aliasAdjusted = normalizeShowInput(showInput);
  const normalized = normalizeLookupValue(aliasAdjusted);

  const exact = shows.find((show) => normalizeLookupValue(show.name) === normalized);
  if (exact) {
    return exact;
  }

  const contains = shows.find((show) => normalizeLookupValue(show.name).includes(normalized));
  return contains ?? null;
}

function resolveShowsFromList(shows: ShowRow[], showInputs: string[]) {
  const uniqueInputs = [...new Set(showInputs.map((value) => value.trim()).filter(Boolean))];

  const resolved: ShowRow[] = [];
  const unresolved: string[] = [];

  for (const input of uniqueInputs) {
    const match = resolveShowFromList(shows, input);
    if (!match) {
      unresolved.push(input);
      continue;
    }

    if (!resolved.some((show) => show.id === match.id)) {
      resolved.push(match);
    }
  }

  return { resolved, unresolved };
}

function resolveRoleFromList(roles: string[], roleInput: string) {
  const aliasAdjusted = normalizeRoleInput(roleInput);
  const normalized = normalizeLookupValue(aliasAdjusted);

  const exact = roles.find((role) => normalizeLookupValue(role) === normalized);
  if (exact) {
    return exact;
  }

  const contains = roles.find((role) => normalizeLookupValue(role).includes(normalized));
  return contains ?? null;
}

async function getShows() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("shows").select("id,name,type").order("name", { ascending: true });

  if (error) {
    throw new Error(`Failed to load shows: ${error.message}`);
  }

  return (data ?? []) as ShowRow[];
}

async function getRoles() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("resources").select("role").order("role", { ascending: true });

  if (error) {
    throw new Error(`Failed to load roles: ${error.message}`);
  }

  return [...new Set(((data ?? []) as RoleRow[]).map((row) => row.role))];
}

export async function resolveShowAndRole(input: {
  showName?: string;
  role?: string;
}): Promise<ResolveShowRoleResult> {
  const [shows, roles] = await Promise.all([getShows(), getRoles()]);

  const normalizedShowInput = input.showName?.trim() ? normalizeShowInput(input.showName) : null;
  const normalizedRoleInput = input.role?.trim() ? normalizeRoleInput(input.role) : null;

  const show = normalizedShowInput ? resolveShowFromList(shows, normalizedShowInput) : null;
  const role = normalizedRoleInput ? resolveRoleFromList(roles, normalizedRoleInput) : null;

  return {
    show: show
      ? {
          id: show.id,
          name: show.name,
          type: show.type,
        }
      : null,
    role,
    normalizedShowInput,
    normalizedRoleInput,
  };
}

export async function findBestBackfillCandidate(input: {
  showName: string;
  role: string;
  includePhone?: boolean;
}): Promise<BestBackfillResult> {
  const resolved = await resolveShowAndRole({ showName: input.showName, role: input.role });

  if (!resolved.show) {
    return {
      show: null,
      role: resolved.role,
      best: null,
      alternatives: [],
      reason: `Could not find show \"${input.showName}\".`,
    };
  }

  if (!resolved.role) {
    return {
      show: resolved.show.name,
      role: null,
      best: null,
      alternatives: [],
      reason: `Could not find role \"${input.role}\".`,
    };
  }

  const supabase = getSupabaseAdminClient();

  const { data: preferences, error: prefError } = await supabase
    .from("backfill_preferences")
    .select("resource_id,rank,is_permanent_crew")
    .eq("show_id", resolved.show.id)
    .eq("role", resolved.role)
    .order("is_permanent_crew", { ascending: true })
    .order("rank", { ascending: true });

  if (prefError) {
    throw new Error(`Failed to load backfill preferences: ${prefError.message}`);
  }

  const prefRows = (preferences ?? []) as BackfillPreferenceRow[];
  if (prefRows.length === 0) {
    return {
      show: resolved.show.name,
      role: resolved.role,
      best: null,
      alternatives: [],
      reason: "No ranked backfill candidates are configured for this show and role.",
    };
  }

  const resourceIds = prefRows.map((row) => row.resource_id);

  const [{ data: resources, error: resourcesError }, { data: skillRows, error: skillError }] = await Promise.all([
    supabase.from("resources").select("id,name,role,phone").in("id", resourceIds),
    supabase
      .from("resource_skills")
      .select("resource_id,status")
      .eq("show_id", resolved.show.id)
      .in("resource_id", resourceIds),
  ]);

  if (resourcesError) {
    throw new Error(`Failed to load resources: ${resourcesError.message}`);
  }

  if (skillError) {
    throw new Error(`Failed to load resource skills: ${skillError.message}`);
  }

  const resourceById = new Map(((resources ?? []) as ResourceRow[]).map((resource) => [resource.id, resource]));
  const statusByResourceId = new Map(((skillRows ?? []) as SkillRow[]).map((row) => [row.resource_id, row.status]));

  const candidates = prefRows
    .map((row) => {
      const resource = resourceById.get(row.resource_id);
      if (!resource) {
        return null;
      }

      return {
        resourceId: resource.id,
        name: resource.name,
        role: resource.role,
        rank: row.rank,
        isPermanentCrew: row.is_permanent_crew,
        status: statusByResourceId.get(resource.id) ?? "NA",
        phone: input.includePhone ? resource.phone ?? undefined : undefined,
      } satisfies BackfillCandidate;
    })
    .filter((candidate): candidate is BackfillCandidate => Boolean(candidate));

  const best = candidates.find((candidate) => !candidate.isPermanentCrew) ?? candidates[0] ?? null;

  return {
    show: resolved.show.name,
    role: resolved.role,
    best,
    alternatives: candidates.slice(0, 5),
  };
}

export async function listApprovedStaff(input: {
  showName: string;
  role: string;
  includePhone?: boolean;
}): Promise<ApprovedStaffResult> {
  const resolved = await resolveShowAndRole({ showName: input.showName, role: input.role });

  if (!resolved.show) {
    return {
      show: null,
      role: resolved.role,
      members: [],
      reason: `Could not find show \"${input.showName}\".`,
    };
  }

  if (!resolved.role) {
    return {
      show: resolved.show.name,
      role: null,
      members: [],
      reason: `Could not find role \"${input.role}\".`,
    };
  }

  const supabase = getSupabaseAdminClient();

  const { data: activeRows, error: activeError } = await supabase
    .from("resource_skills")
    .select("resource_id")
    .eq("show_id", resolved.show.id)
    .eq("status", "Active");

  if (activeError) {
    throw new Error(`Failed to load approved skills: ${activeError.message}`);
  }

  const activeResourceIds = [...new Set((activeRows ?? []).map((row) => row.resource_id as string))];

  if (activeResourceIds.length === 0) {
    return {
      show: resolved.show.name,
      role: resolved.role,
      members: [],
      reason: "No approved crew found for this show and role.",
    };
  }

  const { data: resources, error: resourcesError } = await supabase
    .from("resources")
    .select("id,name,role,phone")
    .in("id", activeResourceIds)
    .eq("role", resolved.role)
    .order("name", { ascending: true });

  if (resourcesError) {
    throw new Error(`Failed to load approved staff: ${resourcesError.message}`);
  }

  const members = ((resources ?? []) as ResourceRow[]).map((resource) => ({
    resourceId: resource.id,
    name: resource.name,
    role: resource.role,
    status: "Active" as const,
    phone: input.includePhone ? resource.phone ?? undefined : undefined,
  }));

  return {
    show: resolved.show.name,
    role: resolved.role,
    members,
    reason: members.length === 0 ? "No approved crew found for this show and role." : undefined,
  };
}

export async function listApprovedStaffAcrossShows(input: {
  showNames: string[];
  role: string;
  includePhone?: boolean;
}): Promise<ApprovedStaffMultiShowResult> {
  const requestedShowNames = [...new Set(input.showNames.map((value) => value.trim()).filter(Boolean))];

  if (requestedShowNames.length === 0) {
    return {
      shows: [],
      unresolvedShows: [],
      role: null,
      members: [],
      reason: "No shows were provided.",
    };
  }

  const [shows, roles] = await Promise.all([getShows(), getRoles()]);
  const resolvedShows = resolveShowsFromList(shows, requestedShowNames);
  const role = resolveRoleFromList(roles, input.role);

  if (resolvedShows.resolved.length === 0) {
    return {
      shows: [],
      unresolvedShows: resolvedShows.unresolved,
      role,
      members: [],
      reason: "Could not resolve any requested shows.",
    };
  }

  if (!role) {
    return {
      shows: resolvedShows.resolved.map((show) => show.name),
      unresolvedShows: resolvedShows.unresolved,
      role: null,
      members: [],
      reason: `Could not find role \"${input.role}\".`,
    };
  }

  const supabase = getSupabaseAdminClient();
  const showIds = resolvedShows.resolved.map((show) => show.id);

  const { data: activeRows, error: activeError } = await supabase
    .from("resource_skills")
    .select("resource_id,show_id,status")
    .in("show_id", showIds)
    .eq("status", "Active");

  if (activeError) {
    throw new Error(`Failed to load approved skills across shows: ${activeError.message}`);
  }

  const activeShowIdsByResource = new Map<string, Set<string>>();
  for (const row of (activeRows ?? []) as SkillWithShowRow[]) {
    const existing = activeShowIdsByResource.get(row.resource_id) ?? new Set<string>();
    existing.add(row.show_id);
    activeShowIdsByResource.set(row.resource_id, existing);
  }

  const intersectionResourceIds = [...activeShowIdsByResource.entries()]
    .filter(([, showIdSet]) => showIds.every((showId) => showIdSet.has(showId)))
    .map(([resourceId]) => resourceId);

  if (intersectionResourceIds.length === 0) {
    return {
      shows: resolvedShows.resolved.map((show) => show.name),
      unresolvedShows: resolvedShows.unresolved,
      role,
      members: [],
      reason: "No approved crew found for this role across all requested shows.",
    };
  }

  const { data: resources, error: resourcesError } = await supabase
    .from("resources")
    .select("id,name,role,phone")
    .in("id", intersectionResourceIds)
    .eq("role", role)
    .order("name", { ascending: true });

  if (resourcesError) {
    throw new Error(`Failed to load approved staff across shows: ${resourcesError.message}`);
  }

  const members = ((resources ?? []) as ResourceRow[]).map((resource) => ({
    resourceId: resource.id,
    name: resource.name,
    role: resource.role,
    status: "Active" as const,
    phone: input.includePhone ? resource.phone ?? undefined : undefined,
  }));

  return {
    shows: resolvedShows.resolved.map((show) => show.name),
    unresolvedShows: resolvedShows.unresolved,
    role,
    members,
    reason: members.length === 0 ? "No approved crew found for this role across all requested shows." : undefined,
  };
}

function createEmptyRoleCoverage(role: string): RoleCoverageBreakdown {
  return {
    role,
    active: 0,
    training: 0,
    refresh: 0,
    na: 0,
    red: 0,
    total: 0,
  };
}

function addStatusToCoverage(coverage: RoleCoverageBreakdown, status: SkillStatus) {
  if (status === "Active") {
    coverage.active += 1;
  } else if (status === "Training") {
    coverage.training += 1;
  } else if (status === "Refresh") {
    coverage.refresh += 1;
  } else if (status === "NA") {
    coverage.na += 1;
  } else if (status === "Red") {
    coverage.red += 1;
  }

  coverage.total += 1;
}

export async function analyzeRoleCoverage(input: { showName?: string }): Promise<RoleCoverageAnalysisResult> {
  const [roles, shows] = await Promise.all([getRoles(), getShows()]);

  if (roles.length === 0) {
    return {
      scope: input.showName ? "single_show" : "all_shows",
      show: null,
      roleBreakdown: [],
      leastActiveRoles: [],
      reason: "No roles are configured.",
    };
  }

  let resolvedShow: ShowRow | null = null;
  if (input.showName?.trim()) {
    resolvedShow = resolveShowFromList(shows, input.showName);
    if (!resolvedShow) {
      return {
        scope: "single_show",
        show: null,
        roleBreakdown: roles.map((role) => createEmptyRoleCoverage(role)),
        leastActiveRoles: roles.map((role) => createEmptyRoleCoverage(role)),
        reason: `Could not find show \"${input.showName}\".`,
      };
    }
  }

  const supabase = getSupabaseAdminClient();

  const [{ data: resources, error: resourcesError }, skillsResponse] = await Promise.all([
    supabase.from("resources").select("id,role"),
    resolvedShow
      ? supabase.from("resource_skills").select("resource_id,show_id,status").eq("show_id", resolvedShow.id)
      : supabase.from("resource_skills").select("resource_id,show_id,status"),
  ]);

  if (resourcesError) {
    throw new Error(`Failed to load resources for role coverage: ${resourcesError.message}`);
  }

  if (skillsResponse.error) {
    throw new Error(`Failed to load skills for role coverage: ${skillsResponse.error.message}`);
  }

  const roleByResourceId = new Map(
    ((resources ?? []) as Array<Pick<ResourceRow, "id" | "role">>).map((resource) => [resource.id, resource.role])
  );

  const coverageByRole = new Map(roles.map((role) => [role, createEmptyRoleCoverage(role)]));

  for (const row of (skillsResponse.data ?? []) as SkillWithShowRow[]) {
    const role = roleByResourceId.get(row.resource_id);
    if (!role) {
      continue;
    }

    const coverage = coverageByRole.get(role) ?? createEmptyRoleCoverage(role);
    addStatusToCoverage(coverage, row.status);
    coverageByRole.set(role, coverage);
  }

  const roleBreakdown = [...coverageByRole.values()].sort(
    (a, b) => a.active - b.active || b.total - a.total || a.role.localeCompare(b.role)
  );

  const leastActiveValue = roleBreakdown.reduce((min, role) => Math.min(min, role.active), Number.MAX_SAFE_INTEGER);
  const leastActiveRoles = roleBreakdown.filter((role) => role.active === leastActiveValue);

  return {
    scope: resolvedShow ? "single_show" : "all_shows",
    show: resolvedShow?.name ?? null,
    roleBreakdown,
    leastActiveRoles,
    reason: roleBreakdown.length === 0 ? "No role coverage rows were found." : undefined,
  };
}

export async function querySkills(input: {
  showName?: string;
  role?: string;
  status?: SkillStatus;
  resourceName?: string;
  includePhone?: boolean;
  limit?: number;
}): Promise<SkillsQueryResult> {
  const [shows, roles] = await Promise.all([getShows(), getRoles()]);
  const normalizedShowInput = input.showName?.trim() ? normalizeShowInput(input.showName) : null;
  const normalizedRoleInput = input.role?.trim() ? normalizeRoleInput(input.role) : null;
  const normalizedResourceName = input.resourceName?.trim().toLowerCase() ?? null;

  const resolvedShow = normalizedShowInput ? resolveShowFromList(shows, normalizedShowInput) : null;
  if (normalizedShowInput && !resolvedShow) {
    return {
      show: null,
      role: normalizedRoleInput,
      status: input.status ?? null,
      resourceName: input.resourceName?.trim() || null,
      matches: [],
      reason: `Could not find show \"${input.showName}\".`,
    };
  }

  const resolvedRole = normalizedRoleInput ? resolveRoleFromList(roles, normalizedRoleInput) : null;
  if (normalizedRoleInput && !resolvedRole) {
    return {
      show: resolvedShow?.name ?? null,
      role: null,
      status: input.status ?? null,
      resourceName: input.resourceName?.trim() || null,
      matches: [],
      reason: `Could not find role \"${input.role}\".`,
    };
  }

  const supabase = getSupabaseAdminClient();
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 200);

  const [resourcesResponse, skillsResponse] = await Promise.all([
    supabase.from("resources").select("id,name,role,phone").order("name", { ascending: true }),
    resolvedShow
      ? supabase
          .from("resource_skills")
          .select("resource_id,show_id,status")
          .eq("show_id", resolvedShow.id)
          .order("resource_id", { ascending: true })
      : supabase.from("resource_skills").select("resource_id,show_id,status").order("resource_id", { ascending: true }),
  ]);

  if (resourcesResponse.error) {
    throw new Error(`Failed to load resources for skills query: ${resourcesResponse.error.message}`);
  }

  if (skillsResponse.error) {
    throw new Error(`Failed to load skills for skills query: ${skillsResponse.error.message}`);
  }

  const resources = (resourcesResponse.data ?? []) as ResourceRow[];
  const skills = (skillsResponse.data ?? []) as SkillWithShowRow[];
  const resourceById = new Map(resources.map((resource) => [resource.id, resource]));
  const showById = new Map(shows.map((show) => [show.id, show]));

  const matches: SkillQueryMatch[] = [];

  for (const skill of skills) {
    const resource = resourceById.get(skill.resource_id);
    const show = showById.get(skill.show_id);
    if (!resource || !show) {
      continue;
    }

    if (resolvedRole && resource.role !== resolvedRole) {
      continue;
    }

    if (input.status && skill.status !== input.status) {
      continue;
    }

    if (normalizedResourceName && !resource.name.toLowerCase().includes(normalizedResourceName)) {
      continue;
    }

    matches.push({
      resourceId: resource.id,
      resourceName: resource.name,
      role: resource.role,
      showId: show.id,
      showName: show.name,
      status: skill.status,
      phone: input.includePhone ? resource.phone ?? undefined : undefined,
    });

    if (matches.length >= limit) {
      break;
    }
  }

  return {
    show: resolvedShow?.name ?? null,
    role: resolvedRole ?? null,
    status: input.status ?? null,
    resourceName: input.resourceName?.trim() || null,
    matches,
    reason: matches.length === 0 ? "No skill records matched the requested filters." : undefined,
  };
}

function buildBackfillRows(
  prefRows: BackfillPreferenceRow[],
  resourcesById: Map<string, ResourceRow>,
  statusByResourceId: Map<string, SkillStatus>,
  includePhone: boolean
) {
  return prefRows
    .map((row) => {
      const resource = resourcesById.get(row.resource_id);
      if (!resource) {
        return null;
      }

      return {
        resourceId: resource.id,
        resourceName: resource.name,
        rank: row.rank,
        status: statusByResourceId.get(resource.id) ?? "NA",
        isPermanentCrew: row.is_permanent_crew,
        phone: includePhone ? resource.phone ?? undefined : undefined,
      } satisfies BackfillRecommendation;
    })
    .filter((row): row is BackfillRecommendation => Boolean(row));
}

export async function analyzeBackfillInsights(input: {
  showName?: string;
  role?: string;
  includePhone?: boolean;
}): Promise<BackfillInsightsResult> {
  const [shows, roles] = await Promise.all([getShows(), getRoles()]);
  const resolvedShow = input.showName?.trim() ? resolveShowFromList(shows, input.showName) : null;
  const resolvedRole = input.role?.trim() ? resolveRoleFromList(roles, input.role) : null;

  if (input.showName?.trim() && !resolvedShow) {
    return {
      show: null,
      role: resolvedRole ?? null,
      insights: [],
      reason: `Could not find show \"${input.showName}\".`,
    };
  }

  if (input.role?.trim() && !resolvedRole) {
    return {
      show: resolvedShow?.name ?? null,
      role: null,
      insights: [],
      reason: `Could not find role \"${input.role}\".`,
    };
  }

  const supabase = getSupabaseAdminClient();

  const backfillQuery = supabase
    .from("backfill_preferences")
    .select("show_id,role,resource_id,rank,is_permanent_crew")
    .order("show_id", { ascending: true })
    .order("role", { ascending: true })
    .order("is_permanent_crew", { ascending: false })
    .order("rank", { ascending: true });

  if (resolvedShow) {
    backfillQuery.eq("show_id", resolvedShow.id);
  }

  if (resolvedRole) {
    backfillQuery.eq("role", resolvedRole);
  }

  const [backfillResponse, resourcesResponse, skillsResponse] = await Promise.all([
    backfillQuery,
    supabase.from("resources").select("id,name,role,phone"),
    resolvedShow
      ? supabase.from("resource_skills").select("resource_id,show_id,status").eq("show_id", resolvedShow.id)
      : supabase.from("resource_skills").select("resource_id,show_id,status"),
  ]);

  if (backfillResponse.error) {
    throw new Error(`Failed to load backfill insights: ${backfillResponse.error.message}`);
  }

  if (resourcesResponse.error) {
    throw new Error(`Failed to load resources for backfill insights: ${resourcesResponse.error.message}`);
  }

  if (skillsResponse.error) {
    throw new Error(`Failed to load skills for backfill insights: ${skillsResponse.error.message}`);
  }

  const resourcesById = new Map(((resourcesResponse.data ?? []) as ResourceRow[]).map((resource) => [resource.id, resource]));
  const showById = new Map(shows.map((show) => [show.id, show.name]));
  const statusByShowAndResource = new Map<string, SkillStatus>();

  for (const row of (skillsResponse.data ?? []) as SkillWithShowRow[]) {
    statusByShowAndResource.set(`${row.show_id}:${row.resource_id}`, row.status);
  }

  const grouped = new Map<string, BackfillPreferenceRow[]>();
  for (const row of (backfillResponse.data ?? []) as Array<BackfillPreferenceRow & { show_id: string; role: string }>) {
    const key = `${row.show_id}:${row.role}`;
    const existing = grouped.get(key) ?? [];
    existing.push({
      resource_id: row.resource_id,
      rank: row.rank,
      is_permanent_crew: row.is_permanent_crew,
    });
    grouped.set(key, existing);
  }

  const insights: BackfillInsightRow[] = [];

  for (const [key, prefRows] of grouped.entries()) {
    const [showId, role] = key.split(":");
    const statusByResourceId = new Map<string, SkillStatus>();
    for (const row of prefRows) {
      const status = statusByShowAndResource.get(`${showId}:${row.resource_id}`);
      if (status) {
        statusByResourceId.set(row.resource_id, status);
      }
    }

    const recommendations = buildBackfillRows(prefRows, resourcesById, statusByResourceId, Boolean(input.includePhone));
    const permanent = recommendations.filter((row) => row.isPermanentCrew);
    const backups = recommendations.filter((row) => !row.isPermanentCrew);
    const permanentActiveCount = permanent.filter((row) => row.status === "Active").length;
    const backupActiveCount = backups.filter((row) => row.status === "Active").length;
    const recommendedFill = backups.find((row) => row.status === "Active") ?? backups[0] ?? null;

    insights.push({
      show: showById.get(showId) ?? showId,
      role,
      permanentCount: permanent.length,
      permanentActiveCount,
      backupCount: backups.length,
      backupActiveCount,
      hasGap: permanentActiveCount === 0,
      recommendedFill,
    });
  }

  insights.sort((a, b) => Number(b.hasGap) - Number(a.hasGap) || a.show.localeCompare(b.show) || a.role.localeCompare(b.role));

  return {
    show: resolvedShow?.name ?? null,
    role: resolvedRole ?? null,
    insights,
    reason: insights.length === 0 ? "No backfill preferences matched the requested filters." : undefined,
  };
}
