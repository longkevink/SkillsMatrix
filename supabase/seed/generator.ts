import type {
  GeneratedBackfillGroup,
  GeneratedResource,
  NamePoolsFixture,
  SeedDataset,
  ShowFixture,
  SkillStatus,
} from "./types";

const STATUSES: Array<{ status: SkillStatus; weight: number }> = [
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

export interface BuildSeedDatasetInput {
  roles: string[];
  shows: ShowFixture[];
  namePools: NamePoolsFixture;
  resourcesPerRole: number;
  seed: number;
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

function buildResourceKey(role: string, name: string) {
  return `${role}::${name}`;
}

function pickWeightedStatus(random: () => number): SkillStatus {
  const total = STATUSES.reduce((sum, item) => sum + item.weight, 0);
  const target = random() * total;

  let current = 0;
  for (const item of STATUSES) {
    current += item.weight;
    if (target <= current) {
      return item.status;
    }
  }

  return "NA";
}

function buildName(
  roleIndex: number,
  resourceIndex: number,
  firstNames: string[],
  lastNames: string[]
) {
  const first = firstNames[(roleIndex * 13 + resourceIndex * 7) % firstNames.length];
  const last = lastNames[(roleIndex * 17 + resourceIndex * 5) % lastNames.length];
  return `${first} ${last}`;
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

export function buildSeedDataset(input: BuildSeedDatasetInput): SeedDataset {
  const random = mulberry32(input.seed);
  const resources: GeneratedResource[] = [];

  input.roles.forEach((role, roleIndex) => {
    for (let i = 0; i < input.resourcesPerRole; i += 1) {
      const name = buildName(roleIndex, i, input.namePools.firstNames, input.namePools.lastNames);
      resources.push({
        key: buildResourceKey(role, name),
        name,
        role,
      });
    }
  });

  const skills = resources.flatMap((resource) => {
    return input.shows.map((show) => {
      const status = pickWeightedStatus(random);
      return {
        resourceKey: resource.key,
        showName: show.name,
        status,
        notes: buildNote(status, random),
      };
    });
  });

  const skillLookup = new Map<string, SkillStatus>();
  for (const skill of skills) {
    skillLookup.set(`${skill.resourceKey}::${skill.showName}`, skill.status);
  }

  const backfillGroups: GeneratedBackfillGroup[] = [];

  for (const show of input.shows) {
    for (const role of input.roles) {
      const eligible = resources
        .filter((resource) => resource.role === role)
        .map((resource) => {
          const status = skillLookup.get(`${resource.key}::${show.name}`) ?? "NA";
          return {
            resource,
            status,
            score: random(),
          };
        })
        .filter((item) => item.status === "Active" || item.status === "Refresh")
        .sort((a, b) => {
          if (a.status !== b.status) {
            return a.status === "Active" ? -1 : 1;
          }

          return b.score - a.score;
        });

      const permanentCount = Math.min(2, eligible.length);
      const permanentResourceKeys = eligible
        .slice(0, permanentCount)
        .map((item) => item.resource.key);
      const backupResourceKeys = eligible
        .slice(permanentCount, permanentCount + 8)
        .map((item) => item.resource.key);

      backfillGroups.push({
        showName: show.name,
        role,
        permanentResourceKeys,
        backupResourceKeys,
      });
    }
  }

  return {
    roles: input.roles,
    shows: input.shows,
    resources,
    skills,
    backfillGroups,
  };
}

export function buildStatusDistribution(skills: Array<{ status: SkillStatus }>) {
  return skills.reduce<Record<SkillStatus, number>>(
    (acc, skill) => {
      acc[skill.status] += 1;
      return acc;
    },
    {
      Active: 0,
      NA: 0,
      Refresh: 0,
      Training: 0,
      Red: 0,
    }
  );
}
