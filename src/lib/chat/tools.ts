import "server-only";

import { z } from "zod";
import {
  analyzeRoleCoverage,
  analyzeBackfillInsights,
  findBestBackfillCandidate,
  listApprovedStaff,
  listApprovedStaffAcrossShows,
  querySkills,
  resolveShowAndRole,
  type BackfillInsightsResult,
  type RoleCoverageAnalysisResult,
  type SkillsQueryResult,
  type BestBackfillResult,
  type ApprovedStaffMultiShowResult,
  type ApprovedStaffResult,
  type ResolveShowRoleResult,
} from "@/src/lib/chat/query-service";

export const CHAT_TOOL_NAMES = [
  "best_backfill",
  "approved_staff",
  "approved_staff_multi_show",
  "query_skills",
  "backfill_insights",
  "role_coverage_analysis",
  "resolve_show_role_terms",
] as const;

export type ChatToolName = (typeof CHAT_TOOL_NAMES)[number];

export interface ChatToolContext {
  allowPhoneNumbers: boolean;
}

export interface ChatToolDependencies {
  findBestBackfillCandidate: (input: {
    showName: string;
    role: string;
    includePhone?: boolean;
  }) => Promise<BestBackfillResult>;
  listApprovedStaff: (input: {
    showName: string;
    role: string;
    includePhone?: boolean;
  }) => Promise<ApprovedStaffResult>;
  listApprovedStaffAcrossShows: (input: {
    showNames: string[];
    role: string;
    includePhone?: boolean;
  }) => Promise<ApprovedStaffMultiShowResult>;
  analyzeRoleCoverage: (input: {
    showName?: string;
  }) => Promise<RoleCoverageAnalysisResult>;
  querySkills: (input: {
    showName?: string;
    role?: string;
    status?: "Active" | "Refresh" | "Training" | "NA" | "Red";
    resourceName?: string;
    includePhone?: boolean;
    limit?: number;
  }) => Promise<SkillsQueryResult>;
  analyzeBackfillInsights: (input: {
    showName?: string;
    role?: string;
    includePhone?: boolean;
  }) => Promise<BackfillInsightsResult>;
  resolveShowAndRole: (input: { showName?: string; role?: string }) => Promise<ResolveShowRoleResult>;
}

const bestBackfillSchema = z.object({
  showName: z.string().min(1),
  role: z.string().min(1),
  includePhone: z.boolean().optional(),
});

const approvedStaffSchema = z.object({
  showName: z.string().min(1),
  role: z.string().min(1),
  includePhone: z.boolean().optional(),
});

const approvedStaffMultiShowSchema = z.object({
  showNames: z.union([z.array(z.string().min(1)).min(1), z.string().min(1)]),
  role: z.string().min(1),
  includePhone: z.boolean().optional(),
});

const roleCoverageSchema = z.object({
  showName: z.string().min(1).optional(),
});

const querySkillsSchema = z.object({
  showName: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  status: z.enum(["Active", "Refresh", "Training", "NA", "Red"]).optional(),
  resourceName: z.string().min(1).optional(),
  includePhone: z.boolean().optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

const backfillInsightsSchema = z.object({
  showName: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  includePhone: z.boolean().optional(),
});

const resolveTermsSchema = z.object({
  showName: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
});

const defaultDependencies: ChatToolDependencies = {
  findBestBackfillCandidate,
  listApprovedStaff,
  listApprovedStaffAcrossShows,
  analyzeRoleCoverage,
  querySkills,
  analyzeBackfillInsights,
  resolveShowAndRole,
};

function parseShowNames(value: string[] | string) {
  const rawItems = Array.isArray(value) ? value : value.split(/\s*(?:,|\band\b|&)\s*/i);
  return [...new Set(rawItems.map((item) => item.trim()).filter(Boolean))];
}

export const geminiToolDeclarations = [
  {
    name: "best_backfill",
    description:
      "Returns the top ranked backfill candidate and alternatives for a specific show and role using backfill_preferences ranks.",
    parameters: {
      type: "OBJECT",
      properties: {
        showName: { type: "STRING", description: "Show name, alias, or abbreviation." },
        role: { type: "STRING", description: "Crew role such as TD or A1." },
        includePhone: {
          type: "BOOLEAN",
          description: "Set true only if user explicitly asked for phone/contact information.",
        },
      },
      required: ["showName", "role"],
    },
  },
  {
    name: "approved_staff",
    description:
      "Lists approved staff for a show and role. Approved means skill status Active for the requested show.",
    parameters: {
      type: "OBJECT",
      properties: {
        showName: { type: "STRING", description: "Show name, alias, or abbreviation." },
        role: { type: "STRING", description: "Crew role such as TD or A1." },
        includePhone: {
          type: "BOOLEAN",
          description: "Set true only if user explicitly asked for phone/contact information.",
        },
      },
      required: ["showName", "role"],
    },
  },
  {
    name: "approved_staff_multi_show",
    description:
      "Lists staff who are approved (Active) for the same role across all requested shows at the same time.",
    parameters: {
      type: "OBJECT",
      properties: {
        showNames: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Two or more show names/aliases. Can also be provided as a single string joined by commas or 'and'.",
        },
        role: { type: "STRING", description: "Crew role such as TD or A1." },
        includePhone: {
          type: "BOOLEAN",
          description: "Set true only if user explicitly asked for phone/contact information.",
        },
      },
      required: ["showNames", "role"],
    },
  },
  {
    name: "query_skills",
    description:
      "Queries skill records with optional filters by show, role, status, and resource name. Use this for skills-table lookups and staffing detail questions.",
    parameters: {
      type: "OBJECT",
      properties: {
        showName: { type: "STRING", description: "Optional show name or alias." },
        role: { type: "STRING", description: "Optional role such as TD or A1." },
        status: { type: "STRING", enum: ["Active", "Refresh", "Training", "NA", "Red"] },
        resourceName: { type: "STRING", description: "Optional person name filter." },
        includePhone: {
          type: "BOOLEAN",
          description: "Set true only if user explicitly asked for phone/contact information.",
        },
        limit: { type: "NUMBER", description: "Optional max rows to return (1-200)." },
      },
    },
  },
  {
    name: "backfill_insights",
    description:
      "Analyzes backfill preferences and highlights gaps, active backup depth, and recommended fill candidates.",
    parameters: {
      type: "OBJECT",
      properties: {
        showName: { type: "STRING", description: "Optional show name or alias." },
        role: { type: "STRING", description: "Optional role filter." },
        includePhone: {
          type: "BOOLEAN",
          description: "Set true only if user explicitly asked for phone/contact information.",
        },
      },
    },
  },
  {
    name: "role_coverage_analysis",
    description:
      "Analyzes active/training/refresh/NA/Red counts by role for one show or all shows, and returns the least-active role(s).",
    parameters: {
      type: "OBJECT",
      properties: {
        showName: {
          type: "STRING",
          description: "Optional show name/alias. Omit to analyze all shows together.",
        },
      },
    },
  },
  {
    name: "resolve_show_role_terms",
    description: "Normalizes show/role terms and resolves aliases before calling other tools.",
    parameters: {
      type: "OBJECT",
      properties: {
        showName: { type: "STRING", description: "Optional show name or alias." },
        role: { type: "STRING", description: "Optional role name or alias." },
      },
    },
  },
] as const;

export function createChatToolExecutor(overrides: Partial<ChatToolDependencies> = {}) {
  const deps: ChatToolDependencies = {
    ...defaultDependencies,
    ...overrides,
  };

  return async function executeChatTool(name: string, args: unknown, context: ChatToolContext) {
    if (name === "best_backfill") {
      const parsed = bestBackfillSchema.safeParse(args);
      if (!parsed.success) {
        return { ok: false, error: "Invalid tool arguments for best_backfill." } as const;
      }

      const includePhone = context.allowPhoneNumbers && Boolean(parsed.data.includePhone);
      const result = await deps.findBestBackfillCandidate({
        showName: parsed.data.showName,
        role: parsed.data.role,
        includePhone,
      });

      return { ok: true, ...result } as const;
    }

    if (name === "approved_staff") {
      const parsed = approvedStaffSchema.safeParse(args);
      if (!parsed.success) {
        return { ok: false, error: "Invalid tool arguments for approved_staff." } as const;
      }

      const includePhone = context.allowPhoneNumbers && Boolean(parsed.data.includePhone);
      const result = await deps.listApprovedStaff({
        showName: parsed.data.showName,
        role: parsed.data.role,
        includePhone,
      });

      return { ok: true, ...result } as const;
    }

    if (name === "approved_staff_multi_show") {
      const parsed = approvedStaffMultiShowSchema.safeParse(args);
      if (!parsed.success) {
        return { ok: false, error: "Invalid tool arguments for approved_staff_multi_show." } as const;
      }

      const includePhone = context.allowPhoneNumbers && Boolean(parsed.data.includePhone);
      const showNames = parseShowNames(parsed.data.showNames);
      const result = await deps.listApprovedStaffAcrossShows({
        showNames,
        role: parsed.data.role,
        includePhone,
      });

      return { ok: true, ...result } as const;
    }

    if (name === "query_skills") {
      const parsed = querySkillsSchema.safeParse(args);
      if (!parsed.success) {
        return { ok: false, error: "Invalid tool arguments for query_skills." } as const;
      }

      const includePhone = context.allowPhoneNumbers && Boolean(parsed.data.includePhone);
      const result = await deps.querySkills({
        showName: parsed.data.showName,
        role: parsed.data.role,
        status: parsed.data.status,
        resourceName: parsed.data.resourceName,
        includePhone,
        limit: parsed.data.limit,
      });

      return { ok: true, ...result } as const;
    }

    if (name === "backfill_insights") {
      const parsed = backfillInsightsSchema.safeParse(args);
      if (!parsed.success) {
        return { ok: false, error: "Invalid tool arguments for backfill_insights." } as const;
      }

      const includePhone = context.allowPhoneNumbers && Boolean(parsed.data.includePhone);
      const result = await deps.analyzeBackfillInsights({
        showName: parsed.data.showName,
        role: parsed.data.role,
        includePhone,
      });

      return { ok: true, ...result } as const;
    }

    if (name === "role_coverage_analysis") {
      const parsed = roleCoverageSchema.safeParse(args);
      if (!parsed.success) {
        return { ok: false, error: "Invalid tool arguments for role_coverage_analysis." } as const;
      }

      const result = await deps.analyzeRoleCoverage({
        showName: parsed.data.showName,
      });

      return { ok: true, ...result } as const;
    }

    if (name === "resolve_show_role_terms") {
      const parsed = resolveTermsSchema.safeParse(args);
      if (!parsed.success) {
        return { ok: false, error: "Invalid tool arguments for resolve_show_role_terms." } as const;
      }

      const result = await deps.resolveShowAndRole({
        showName: parsed.data.showName,
        role: parsed.data.role,
      });

      return {
        ok: true,
        show: result.show,
        role: result.role,
        normalizedShowInput: result.normalizedShowInput,
        normalizedRoleInput: result.normalizedRoleInput,
      } as const;
    }

    return {
      ok: false,
      error: `Unknown tool: ${name}`,
    } as const;
  };
}

export const executeChatTool = createChatToolExecutor();
