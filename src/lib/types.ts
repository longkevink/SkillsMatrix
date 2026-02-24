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
  phone?: string;
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

export interface DashboardResource extends Pick<Resource, "id" | "name" | "role" | "phone"> {
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
  resourcePhone?: string;
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

/* ── Dashboard Analytics ────────────────────────────── */

export interface StatusDistribution {
  active: number;
  training: number;
  refresh: number;
  na: number;
  red: number;
  total: number;
}

export interface HeatmapCell {
  showId: string;
  showName: string;
  role: string;
  dominantStatus: SkillStatus;
  active: number;
  training: number;
  total: number;
}

export interface RoleRiskRow {
  role: string;
  activeCount: number;
  trainingCount: number;
  target: number;
  deficit: number;
  severity: "ok" | "warning" | "critical";
}

export interface TrainingPipelineItem {
  resourceName: string;
  role: string;
  showName: string;
  status: SkillStatus;
}

export interface TrainingInsight {
  showName: string;
  role: string;
  reason: string;
}

export interface DashboardAnalytics {
  totalStaff: number;
  totalShows: number;
  totalControlRooms: number;
  activeAssignments: number;
  trainingAssignments: number;
  coverageScore: number;
  openBackfillGaps: number;
  readyBackfills: number;
  statusDistribution: StatusDistribution;
  heatmapData: HeatmapCell[];
  roleRisks: RoleRiskRow[];
  trainingPipeline: TrainingPipelineItem[];
  trainingInsights: TrainingInsight[];
  uniqueRoles: string[];
  uniqueShowNames: string[];
}
