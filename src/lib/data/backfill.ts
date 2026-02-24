import "server-only";
import { getSupabaseAdminClient } from "@/src/lib/supabase/admin";
import type { BackfillEntry, BackfillPageData, Resource, Show, SkillStatus } from "@/src/lib/types";

interface BackfillSkillRow {
  resource_id: string;
  show_id: string;
  status: SkillStatus;
}

interface BackfillPreferenceRow {
  id: string;
  show_id: string;
  role: string;
  resource_id: string;
  rank: number;
  is_permanent_crew: boolean;
}

export async function getBackfillPageData(showId?: string): Promise<BackfillPageData> {
  const supabase = getSupabaseAdminClient();

  const [showsRes, resourcesRes, skillsRes] = await Promise.all([
    supabase.from("shows").select("id,name,type,created_at").order("name", { ascending: true }),
    supabase
      .from("resources")
      .select("id,name,role,phone,created_at")
      .order("role", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("resource_skills").select("resource_id,show_id,status"),
  ]);

  if (showsRes.error) {
    throw new Error(`Failed to load shows: ${showsRes.error.message}`);
  }

  if (resourcesRes.error) {
    throw new Error(`Failed to load resources: ${resourcesRes.error.message}`);
  }

  if (skillsRes.error) {
    throw new Error(`Failed to load resource skills: ${skillsRes.error.message}`);
  }

  const shows = (showsRes.data ?? []) as Show[];
  const resources = (resourcesRes.data ?? []) as Resource[];
  const skills = (skillsRes.data ?? []) as BackfillSkillRow[];

  if (!shows.length) {
    throw new Error("No shows found. Run the seed script to populate data.");
  }

  const selectedShow = shows.find((show) => show.id === showId) ?? shows[0];

  const { data: rows, error: backfillError } = await supabase
    .from("backfill_preferences")
    .select("id,show_id,role,resource_id,rank,is_permanent_crew")
    .eq("show_id", selectedShow.id)
    .order("role", { ascending: true })
    .order("is_permanent_crew", { ascending: false })
    .order("rank", { ascending: true });

  if (backfillError) {
    throw new Error(`Failed to load backfill preferences: ${backfillError.message}`);
  }

  // Map skill status for the selected show
  const skillStatusByResource = new Map<string, SkillStatus>();
  for (const skill of skills) {
    if (skill.show_id === selectedShow.id) {
      skillStatusByResource.set(skill.resource_id, skill.status);
    }
  }

  const resourceNameById = new Map(resources.map((resource) => [resource.id, resource.name]));
  const resourcePhoneById = new Map(resources.map((resource) => [resource.id, resource.phone]));

  const grouped = new Map<string, { permanentCrew: BackfillEntry[]; backupList: BackfillEntry[] }>();
  const prefRows = (rows ?? []) as BackfillPreferenceRow[];

  for (const row of prefRows) {
    const roleBucket = grouped.get(row.role) ?? { permanentCrew: [], backupList: [] };

    const entry: BackfillEntry = {
      id: row.id,
      resourceId: row.resource_id,
      resourceName: resourceNameById.get(row.resource_id) ?? "Unknown Resource",
      resourcePhone: resourcePhoneById.get(row.resource_id) ?? undefined,
      rank: row.rank,
      isPermanentCrew: row.is_permanent_crew,
      status: skillStatusByResource.get(row.resource_id) ?? "NA",
    };

    if (row.is_permanent_crew) {
      roleBucket.permanentCrew.push(entry);
    } else {
      roleBucket.backupList.push(entry);
    }

    grouped.set(row.role, roleBucket);
  }

  // Append any resources not explicitly assigned as backup to the end of their role's backup list
  const assignedResourceIds = new Set(prefRows.map(row => row.resource_id));

  for (const resource of resources) {
    if (!assignedResourceIds.has(resource.id)) {
      const roleBucket = grouped.get(resource.role) ?? { permanentCrew: [], backupList: [] };
      roleBucket.backupList.push({
        id: `unassigned-${resource.id}`,
        resourceId: resource.id,
        resourceName: resource.name,
        resourcePhone: resource.phone,
        rank: 9999,
        isPermanentCrew: false,
        status: skillStatusByResource.get(resource.id) ?? "NA",
      });
      grouped.set(resource.role, roleBucket);
    }
  }

  const allRoles = [...new Set(resources.map((resource) => resource.role))].sort((a, b) => a.localeCompare(b));

  return {
    selectedShow: {
      id: selectedShow.id,
      name: selectedShow.name,
      type: selectedShow.type,
    },
    shows: shows.map((show) => ({ id: show.id, name: show.name, type: show.type })),
    roles: allRoles.map((role) => {
      const roleRows = grouped.get(role) ?? { permanentCrew: [], backupList: [] };
      return {
        role,
        permanentCrew: roleRows.permanentCrew,
        backupList: roleRows.backupList,
      };
    }),
  };
}
