import "server-only";
import { getSupabaseAdminClient } from "@/src/lib/supabase/admin";
import type { DashboardData, Resource, ResourceSkill, Show } from "@/src/lib/types";

interface ControlRoomSkillRow {
  resource_id: string;
  control_room_id: string;
  status: ResourceSkill["status"];
  notes: string | null;
}

export async function getDashboardData(): Promise<DashboardData> {
  const supabase = getSupabaseAdminClient();

  const [showsRes, resourcesRes, skillsRes, crSkillsRes] = await Promise.all([
    supabase.from("shows").select("id,name,type,created_at").order("name", { ascending: true }),
    supabase
      .from("resources")
      .select("id,name,role,phone,created_at")
      .order("role", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("resource_skills").select("id,resource_id,show_id,status,notes,updated_at"),
    supabase.from("resource_control_room_skills").select("id,resource_id,control_room_id,status,notes,updated_at"),
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

  if (crSkillsRes.error) {
    throw new Error(`Failed to load control room skills: ${crSkillsRes.error.message}`);
  }

  const shows = (showsRes.data ?? []) as Show[];
  const resources = (resourcesRes.data ?? []) as Resource[];
  const skills = (skillsRes.data ?? []) as ResourceSkill[];
  const crSkills = (crSkillsRes.data ?? []) as ControlRoomSkillRow[];

  const skillsByResource = new Map<string, Record<string, { status: ResourceSkill["status"]; notes: string | null }>>();
  for (const skill of skills) {
    const current = skillsByResource.get(skill.resource_id) ?? {};
    current[skill.show_id] = {
      status: skill.status,
      notes: skill.notes,
    };
    skillsByResource.set(skill.resource_id, current);
  }

  const crSkillsByResource = new Map<string, Record<string, { status: ResourceSkill["status"]; notes: string | null }>>();
  for (const skill of crSkills) {
    const current = crSkillsByResource.get(skill.resource_id) ?? {};
    current[skill.control_room_id] = {
      status: skill.status,
      notes: skill.notes,
    };
    crSkillsByResource.set(skill.resource_id, current);
  }

  return {
    shows: shows.map((show) => ({ id: show.id, name: show.name, type: show.type })),
    resources: resources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      role: resource.role,
      phone: resource.phone,
      skills: skillsByResource.get(resource.id) ?? {},
      controlRoomSkills: crSkillsByResource.get(resource.id) ?? {},
    })),
  };
}
