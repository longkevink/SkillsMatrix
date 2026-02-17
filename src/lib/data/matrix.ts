import "server-only";
import { getSupabaseAdminClient } from "@/src/lib/supabase/admin";
import type { ControlRoom, MatrixPageData, Resource, ResourceSkill, Show, SkillStatus } from "@/src/lib/types";

const CONTROL_ROOM_CODE_ORDER = ["CR1A", "CR31", "CR32", "CR33", "CR34", "CR74", "CR76"] as const;

type ControlRoomCode = (typeof CONTROL_ROOM_CODE_ORDER)[number];

function sortControlRoomsByFixedOrder(controlRooms: Array<Pick<ControlRoom, "id" | "code">>) {
  const order = new Map<string, number>(
    CONTROL_ROOM_CODE_ORDER.map((code, index) => [code, index])
  );

  return [...controlRooms].sort((a, b) => {
    const aRank = order.get(a.code) ?? Number.MAX_SAFE_INTEGER;
    const bRank = order.get(b.code) ?? Number.MAX_SAFE_INTEGER;

    if (aRank !== bRank) {
      return aRank - bRank;
    }

    return a.code.localeCompare(b.code);
  });
}

async function ensureDefaultControlRooms(supabase: ReturnType<typeof getSupabaseAdminClient>) {
  // Safe, idempotent seed so the Control Rooms tab works even if `seed:db` wasn't run.
  const { error } = await supabase
    .from("control_rooms")
    .upsert(CONTROL_ROOM_CODE_ORDER.map((code) => ({ code })), { onConflict: "code" });

  if (error) {
    throw new Error(error.message);
  }
}

interface ResourceControlRoomSkillRow {
  id: string;
  resource_id: string;
  control_room_id: string;
  status: SkillStatus;
  notes: string | null;
  updated_at: string;
}

function isMissingControlRoomTableError(message: string) {
  const normalized = message.toLowerCase();
  return (
    (normalized.includes("schema cache") && normalized.includes("control_rooms")) ||
    normalized.includes("relation \"public.control_rooms\" does not exist") ||
    normalized.includes("relation \"control_rooms\" does not exist")
  );
}

function isMissingControlRoomSkillsTableError(message: string) {
  const normalized = message.toLowerCase();
  return (
    (normalized.includes("schema cache") && normalized.includes("resource_control_room_skills")) ||
    normalized.includes("relation \"public.resource_control_room_skills\" does not exist") ||
    normalized.includes("relation \"resource_control_room_skills\" does not exist")
  );
}

export async function getMatrixPageData(): Promise<MatrixPageData> {
  const supabase = getSupabaseAdminClient();

  const [showsRes, resourcesRes, skillsRes, controlRoomsRes, crSkillsRes] = await Promise.all([
    supabase.from("shows").select("id,name,type,created_at").order("name", { ascending: true }),
    supabase
      .from("resources")
      .select("id,name,role,created_at")
      .order("role", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("resource_skills").select("id,resource_id,show_id,status,notes,updated_at"),
    supabase.from("control_rooms").select("id,code,created_at").order("code", { ascending: true }),
    supabase
      .from("resource_control_room_skills")
      .select("id,resource_id,control_room_id,status,notes,updated_at"),
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
  const skills = (skillsRes.data ?? []) as ResourceSkill[];

  // Let the Shows tab work even if the control room tables haven't been migrated yet.
  let controlRoomsLoadError: string | null = null;
  let controlRooms: ControlRoom[] = [];
  if (controlRoomsRes.error) {
    if (!isMissingControlRoomTableError(controlRoomsRes.error.message)) {
      throw new Error(`Failed to load control rooms: ${controlRoomsRes.error.message}`);
    }
    controlRoomsLoadError = controlRoomsRes.error.message;
  } else {
    controlRooms = (controlRoomsRes.data ?? []) as ControlRoom[];
  }

  let controlRoomSkillsLoadError: string | null = null;
  let controlRoomSkills: ResourceControlRoomSkillRow[] = [];
  if (crSkillsRes.error) {
    if (!isMissingControlRoomSkillsTableError(crSkillsRes.error.message)) {
      throw new Error(`Failed to load control room skills: ${crSkillsRes.error.message}`);
    }
    controlRoomSkillsLoadError = crSkillsRes.error.message;
  } else {
    controlRoomSkills = (crSkillsRes.data ?? []) as ResourceControlRoomSkillRow[];
  }

  if (controlRoomsRes.error == null && controlRooms.length === 0) {
    try {
      await ensureDefaultControlRooms(supabase);
      const retry = await supabase
        .from("control_rooms")
        .select("id,code,created_at")
        .order("code", { ascending: true });
      if (retry.error) {
        throw new Error(retry.error.message);
      }
      controlRooms = (retry.data ?? []) as ControlRoom[];
    } catch {
      // Ignore; the UI will display guidance if the list stays empty.
    }
  }

  const skillsByResource = new Map<string, Record<string, { status: ResourceSkill["status"]; notes: string | null }>>();
  for (const skill of skills) {
    const current = skillsByResource.get(skill.resource_id) ?? {};
    current[skill.show_id] = {
      status: skill.status,
      notes: skill.notes,
    };
    skillsByResource.set(skill.resource_id, current);
  }

  const controlRoomSkillsByResource = new Map<
    string,
    Record<string, { status: SkillStatus; notes: string | null }>
  >();

  for (const skill of controlRoomSkills) {
    const current = controlRoomSkillsByResource.get(skill.resource_id) ?? {};
    current[skill.control_room_id] = {
      status: skill.status,
      notes: skill.notes,
    };
    controlRoomSkillsByResource.set(skill.resource_id, current);
  }

  const sortedControlRooms = sortControlRoomsByFixedOrder(
    controlRooms.map((room) => ({ id: room.id, code: room.code as ControlRoomCode | string }))
  );

  return {
    shows: shows.map((show) => ({ id: show.id, name: show.name, type: show.type })),
    controlRooms: sortedControlRooms.map((room) => ({ id: room.id, code: room.code })),
    resources: resources.map((resource) => ({
      id: resource.id,
      name: resource.name,
      role: resource.role,
      skills: skillsByResource.get(resource.id) ?? {},
      controlRoomSkills: controlRoomSkillsByResource.get(resource.id) ?? {},
    })),
    controlRoomsLoadError,
    controlRoomSkillsLoadError,
  };
}
