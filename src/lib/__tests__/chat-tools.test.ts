import { describe, expect, it, vi } from "vitest";
import { createChatToolExecutor } from "@/src/lib/chat/tools";
import { normalizeRoleInput, normalizeShowInput } from "@/src/lib/chat/query-service";

describe("chat term normalization", () => {
  it("normalizes show aliases", () => {
    expect(normalizeShowInput("nn")).toBe("Nightly News");
    expect(normalizeShowInput("nightly news")).toBe("Nightly News");
    expect(normalizeShowInput("Today Show")).toBe("Today Show");
  });

  it("normalizes role aliases", () => {
    expect(normalizeRoleInput("technical director")).toBe("TD");
    expect(normalizeRoleInput("td")).toBe("TD");
    expect(normalizeRoleInput("A1")).toBe("A1");
  });
});

describe("chat tool executor", () => {
  it("blocks phone output when caller did not explicitly request it", async () => {
    const approvedStaffMock = vi.fn(async () => ({
      show: "Nightly News",
      role: "TD",
      members: [],
    }));

    const execute = createChatToolExecutor({
      listApprovedStaff: approvedStaffMock,
    });

    await execute(
      "approved_staff",
      {
        showName: "Nightly News",
        role: "TD",
        includePhone: true,
      },
      {
        allowPhoneNumbers: false,
      }
    );

    expect(approvedStaffMock).toHaveBeenCalledWith({
      showName: "Nightly News",
      role: "TD",
      includePhone: false,
    });
  });

  it("returns unknown-tool error for unsupported tool names", async () => {
    const execute = createChatToolExecutor();

    const result = await execute("unknown_tool", {}, { allowPhoneNumbers: false });

    expect(result).toEqual({
      ok: false,
      error: "Unknown tool: unknown_tool",
    });
  });

  it("parses multi-show string requests into show intersections", async () => {
    const multiShowMock = vi.fn(async () => ({
      shows: ["Specials Standby", "Nightly News"],
      unresolvedShows: [],
      role: "TD",
      members: [],
    }));

    const execute = createChatToolExecutor({
      listApprovedStaffAcrossShows: multiShowMock,
    });

    await execute(
      "approved_staff_multi_show",
      {
        showNames: "Specials Standby and Nightly News",
        role: "TD",
      },
      {
        allowPhoneNumbers: false,
      }
    );

    expect(multiShowMock).toHaveBeenCalledWith({
      showNames: ["Specials Standby", "Nightly News"],
      role: "TD",
      includePhone: false,
    });
  });

  it("routes role coverage questions to role_coverage_analysis", async () => {
    const coverageMock = vi.fn(async () => ({
      scope: "single_show" as const,
      show: "Today Show",
      roleBreakdown: [],
      leastActiveRoles: [],
    }));

    const execute = createChatToolExecutor({
      analyzeRoleCoverage: coverageMock,
    });

    await execute(
      "role_coverage_analysis",
      {
        showName: "Today Show",
      },
      {
        allowPhoneNumbers: false,
      }
    );

    expect(coverageMock).toHaveBeenCalledWith({
      showName: "Today Show",
    });
  });

  it("routes direct skills lookups through query_skills", async () => {
    const querySkillsMock = vi.fn(async () => ({
      show: "Today Show",
      role: "TD",
      status: "Active" as const,
      resourceName: null,
      matches: [],
    }));

    const execute = createChatToolExecutor({
      querySkills: querySkillsMock,
    });

    await execute(
      "query_skills",
      {
        showName: "Today Show",
        role: "TD",
        status: "Active",
        limit: 25,
      },
      {
        allowPhoneNumbers: false,
      }
    );

    expect(querySkillsMock).toHaveBeenCalledWith({
      showName: "Today Show",
      role: "TD",
      status: "Active",
      resourceName: undefined,
      includePhone: false,
      limit: 25,
    });
  });

  it("routes backfill intelligence queries through backfill_insights", async () => {
    const backfillInsightsMock = vi.fn(async () => ({
      show: "Nightly News",
      role: "TD",
      insights: [],
    }));

    const execute = createChatToolExecutor({
      analyzeBackfillInsights: backfillInsightsMock,
    });

    await execute(
      "backfill_insights",
      {
        showName: "Nightly News",
        role: "TD",
        includePhone: true,
      },
      {
        allowPhoneNumbers: false,
      }
    );

    expect(backfillInsightsMock).toHaveBeenCalledWith({
      showName: "Nightly News",
      role: "TD",
      includePhone: false,
    });
  });
});
