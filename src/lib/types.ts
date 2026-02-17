export type SkillStatus = "Active" | "Refresh" | "Training" | "NA" | "Red";

export type MockRole = "Read Only" | "Manager" | "Admin";

export interface ControlRoom {
  id: string;
  code: string;
  created_at: string;
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  created_at: string;
}

export interface Show {
  id: string;
  name: string;
  type: string;
  created_at: string;
}

export interface ResourceSkill {
  id: string;
  resource_id: string;
  show_id: string;
  status: SkillStatus;
  notes: string | null;
  updated_at: string;
}

export interface DashboardResource extends Pick<Resource, "id" | "name" | "role"> {
  skills: Record<string, { status: SkillStatus; notes: string | null }>;
  controlRoomSkills: Record<string, { status: SkillStatus; notes: string | null }>;
}

export interface DashboardData {
  shows: Array<Pick<Show, "id" | "name" | "type">>;
  resources: DashboardResource[];
}

export interface MatrixPageData {
  shows: Array<Pick<Show, "id" | "name" | "type">>;
  controlRooms: Array<Pick<ControlRoom, "id" | "code">>;
  resources: DashboardResource[];
  controlRoomsLoadError?: string | null;
  controlRoomSkillsLoadError?: string | null;
}

export interface BackfillEntry {
  id: string;
  resourceId: string;
  resourceName: string;
  rank: number;
  isPermanentCrew: boolean;
  status: SkillStatus;
}

export interface BackfillRoleData {
  role: string;
  permanentCrew: BackfillEntry[];
  backupList: BackfillEntry[];
}

export interface BackfillPageData {
  selectedShow: Pick<Show, "id" | "name" | "type">;
  shows: Array<Pick<Show, "id" | "name" | "type">>;
  roles: BackfillRoleData[];
}

export interface ExecutiveRiskRole {
  role: string;
  active: number;
  training: number;
  deficit: number;
}

export interface ExecutiveSnapshot {
  totalStaff: number;
  activeAssignments: number;
  trainingAssignments: number;
  refreshAssignments: number;
  redAssignments: number;
  openBackfillGaps: number;
  readyBackfills: number;
  coverageScore: number;
  criticalCount: number;
  warningCount: number;
  topRiskRoles: ExecutiveRiskRole[];
}

export interface UpdateSkillInput {
  resourceId: string;
  showId: string;
  status: SkillStatus;
  notes: string;
  mockRole: MockRole;
}

export interface ReorderBackfillInput {
  showId: string;
  role: string;
  permanentResourceIds: string[];
  backupResourceIds: string[];
  mockRole: MockRole;
}
