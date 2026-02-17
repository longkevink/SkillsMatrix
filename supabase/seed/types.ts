export type SkillStatus = "Active" | "Refresh" | "Training" | "NA" | "Red";

export interface ShowFixture {
  name: string;
  type: string;
}

export interface NamePoolsFixture {
  firstNames: string[];
  lastNames: string[];
}

export interface GeneratedResource {
  key: string;
  name: string;
  role: string;
}

export interface GeneratedSkill {
  resourceKey: string;
  showName: string;
  status: SkillStatus;
  notes: string | null;
}

export interface GeneratedBackfillGroup {
  showName: string;
  role: string;
  permanentResourceKeys: string[];
  backupResourceKeys: string[];
}

export interface SeedDataset {
  roles: string[];
  shows: ShowFixture[];
  resources: GeneratedResource[];
  skills: GeneratedSkill[];
  backfillGroups: GeneratedBackfillGroup[];
}
