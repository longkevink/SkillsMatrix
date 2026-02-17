import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { buildSeedDataset, buildStatusDistribution } from "./generator";

dotenv.config({ path: ".env.local" });
import type { NamePoolsFixture, ShowFixture, SkillStatus } from "./types";

const RESOURCES_PER_ROLE = 20;
const RNG_SEED = 20260209;

const CONTROL_ROOM_STATUSES: Array<{ status: SkillStatus; weight: number }> = [
  { status: "Active", weight: 45 },
  { status: "NA", weight: 40 },
  { status: "Refresh", weight: 8 },
  { status: "Training", weight: 5 },
  { status: "Red", weight: 2 },
];

const REFRESH_NOTES = [
  "Needs quarter refresh with lead operator.",
  "Re-certification pending this month.",
  "Schedule one supervised shift before solo.",
];

const TRAINING_NOTES = [
  "In training rotation for this room.",
  "Complete mentor sign-off before activation.",
  "Shadow shift required for confidence.",
];

const RED_NOTES = [
  "Do not assign pending manager review.",
  "Temporary blocker: re-approval needed.",
  "Unavailable for this control room until cleared.",
];

interface DbShow {
  id: string;
  name: string;
}

interface DbResource {
  id: string;
  name: string;
  role: string;
}

interface DbControlRoom {
  id: string;
  code: string;
}

function assertEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

async function readJsonFixture<T>(fileName: string): Promise<T> {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const filePath = path.join(currentDir, "fixtures", fileName);
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

function resourceKey(role: string, name: string) {
  return `${role}::${name}`;
}

function mulberry32(seed: number) {
  let state = seed >>> 0;

  return function random() {
    state += 0x6d2b79f5;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeightedStatus(random: () => number): SkillStatus {
  const total = CONTROL_ROOM_STATUSES.reduce((sum, item) => sum + item.weight, 0);
  const target = random() * total;

  let current = 0;
  for (const item of CONTROL_ROOM_STATUSES) {
    current += item.weight;
    if (target <= current) {
      return item.status;
    }
  }

  return "NA";
}

function buildNote(status: SkillStatus, random: () => number) {
  if (status === "NA") {
    return null;
  }

  if (status === "Red") {
    return RED_NOTES[Math.floor(random() * RED_NOTES.length)];
  }

  if (status === "Refresh" && random() < 0.8) {
    return REFRESH_NOTES[Math.floor(random() * REFRESH_NOTES.length)];
  }

  if (status === "Training" && random() < 0.9) {
    return TRAINING_NOTES[Math.floor(random() * TRAINING_NOTES.length)];
  }

  if (status === "Active" && random() < 0.08) {
    return "Active but due for routine quality check.";
  }

  return null;
}

async function seed() {
  const supabaseUrl = assertEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = assertEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const roles = await readJsonFixture<string[]>("roles.json");
  const shows = await readJsonFixture<ShowFixture[]>("shows.json");
  const controlRoomCodes = await readJsonFixture<string[]>("control_rooms.json");
  const namePools = await readJsonFixture<NamePoolsFixture>("name_pools.json");

  const dataset = buildSeedDataset({
    roles,
    shows,
    namePools,
    resourcesPerRole: RESOURCES_PER_ROLE,
    seed: RNG_SEED,
  });

  const { data: upsertedShows, error: showError } = await supabase
    .from("shows")
    .upsert(
      dataset.shows.map((show) => ({ name: show.name, type: show.type })),
      { onConflict: "name" }
    )
    .select("id,name");

  if (showError) {
    throw new Error(`Failed to upsert shows: ${showError.message}`);
  }

  const { data: upsertedResources, error: resourceError } = await supabase
    .from("resources")
    .upsert(
      dataset.resources.map((resource) => ({
        name: resource.name,
        role: resource.role,
      })),
      { onConflict: "name,role" }
    )
    .select("id,name,role");

  if (resourceError) {
    throw new Error(`Failed to upsert resources: ${resourceError.message}`);
  }

  const { data: upsertedControlRooms, error: controlRoomError } = await supabase
    .from("control_rooms")
    .upsert(controlRoomCodes.map((code) => ({ code })), { onConflict: "code" })
    .select("id,code");

  if (controlRoomError) {
    throw new Error(`Failed to upsert control rooms: ${controlRoomError.message}`);
  }

  const showByName = new Map((upsertedShows ?? []).map((show: DbShow) => [show.name, show.id]));
  const resourceByKey = new Map(
    (upsertedResources ?? []).map((resource: DbResource) => [
      resourceKey(resource.role, resource.name),
      resource.id,
    ])
  );
  const controlRoomByCode = new Map(
    (upsertedControlRooms ?? []).map((room: DbControlRoom) => [room.code, room.id])
  );

  const skillRows = dataset.skills.map((skill) => {
    const showId = showByName.get(skill.showName);
    const resourceId = resourceByKey.get(skill.resourceKey);

    if (!showId || !resourceId) {
      throw new Error(`Could not map IDs for skill row ${skill.resourceKey} -> ${skill.showName}`);
    }

    return {
      resource_id: resourceId,
      show_id: showId,
      status: skill.status,
      notes: skill.notes,
    };
  });

  const { error: skillError } = await supabase
    .from("resource_skills")
    .upsert(skillRows, { onConflict: "resource_id,show_id" });

  if (skillError) {
    throw new Error(`Failed to upsert resource skills: ${skillError.message}`);
  }

  const random = mulberry32(RNG_SEED + 1);

  const controlRoomSkillRows = dataset.resources.flatMap((resource) => {
    const resourceId = resourceByKey.get(resource.key);
    if (!resourceId) {
      return [];
    }

    return controlRoomCodes.flatMap((code) => {
      const controlRoomId = controlRoomByCode.get(code);
      if (!controlRoomId) {
        return [];
      }

      const status = pickWeightedStatus(random);

      return [
        {
          resource_id: resourceId,
          control_room_id: controlRoomId,
          status,
          notes: buildNote(status, random),
        },
      ];
    });
  });

  const { error: controlRoomSkillError } = await supabase
    .from("resource_control_room_skills")
    .upsert(controlRoomSkillRows, { onConflict: "resource_id,control_room_id" });

  if (controlRoomSkillError) {
    throw new Error(`Failed to upsert control room skills: ${controlRoomSkillError.message}`);
  }

  for (const group of dataset.backfillGroups) {
    const showId = showByName.get(group.showName);
    if (!showId) {
      continue;
    }

    const { error: deleteError } = await supabase
      .from("backfill_preferences")
      .delete()
      .eq("show_id", showId)
      .eq("role", group.role);

    if (deleteError) {
      throw new Error(`Failed to clear backfill rows for ${group.showName} / ${group.role}: ${deleteError.message}`);
    }

    const permanentRows = group.permanentResourceKeys.map((key, index) => ({
      show_id: showId,
      role: group.role,
      resource_id: resourceByKey.get(key),
      rank: index + 1,
      is_permanent_crew: true,
    }));

    const backupRows = group.backupResourceKeys.map((key, index) => ({
      show_id: showId,
      role: group.role,
      resource_id: resourceByKey.get(key),
      rank: index + 1,
      is_permanent_crew: false,
    }));

    const rows = [...permanentRows, ...backupRows].filter(
      (row): row is { show_id: string; role: string; resource_id: string; rank: number; is_permanent_crew: boolean } =>
        Boolean(row.resource_id)
    );

    if (!rows.length) {
      continue;
    }

    const { error: insertError } = await supabase
      .from("backfill_preferences")
      .insert(rows);

    if (insertError) {
      throw new Error(`Failed to insert backfill rows for ${group.showName} / ${group.role}: ${insertError.message}`);
    }
  }

  const distribution = buildStatusDistribution(dataset.skills);
  const totalSkills = dataset.skills.length;

  const distributionPercent = Object.entries(distribution).reduce(
    (acc, [status, count]) => {
      acc[status as SkillStatus] = Number(((count / totalSkills) * 100).toFixed(2));
      return acc;
    },
    {
      Active: 0,
      NA: 0,
      Refresh: 0,
      Training: 0,
      Red: 0,
    } as Record<SkillStatus, number>
  );

  console.log("Seed complete.");
  console.log(`Roles: ${dataset.roles.length}`);
  console.log(`Resources: ${dataset.resources.length}`);
  console.log(`Shows: ${dataset.shows.length}`);
  console.log(`Control rooms: ${controlRoomCodes.length}`);
  console.log(`resource_skills rows: ${dataset.skills.length}`);
  console.log(`resource_control_room_skills rows: ${controlRoomSkillRows.length}`);
  console.log("Status distribution (%):", distributionPercent);
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
