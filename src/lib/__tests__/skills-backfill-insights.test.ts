import { beforeEach, describe, expect, it, vi } from "vitest";

const getSupabaseAdminClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/src/lib/supabase/admin", () => ({
  getSupabaseAdminClient: (...args: unknown[]) => getSupabaseAdminClientMock(...args),
}));

import { analyzeBackfillInsights, querySkills } from "@/src/lib/chat/query-service";

type TableName = "shows" | "resources" | "resource_skills" | "backfill_preferences";

type RowValue = string | number | boolean | null;
interface Row {
  [key: string]: RowValue;
}

class MockQueryBuilder {
  private readonly rows: Row[];
  private readonly filters: Array<(row: Row) => boolean> = [];

  constructor(rows: Row[]) {
    this.rows = rows;
  }

  select() {
    return this;
  }

  eq(field: string, value: RowValue) {
    this.filters.push((row) => row[field] === value);
    return this;
  }

  in(field: string, values: RowValue[]) {
    const lookup = new Set(values);
    this.filters.push((row) => lookup.has(row[field]));
    return this;
  }

  order() {
    return this;
  }

  then<TResult1 = { data: Row[]; error: null }, TResult2 = never>(
    onfulfilled?: ((value: { data: Row[]; error: null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ) {
    const data = this.rows.filter((row) => this.filters.every((filter) => filter(row)));
    return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
  }
}

function createMockSupabase(tables: Record<TableName, Row[]>) {
  return {
    from(table: TableName) {
      return new MockQueryBuilder(tables[table] ?? []);
    },
  };
}

describe("skills and backfill insights", () => {
  beforeEach(() => {
    getSupabaseAdminClientMock.mockReset();
    getSupabaseAdminClientMock.mockReturnValue(
      createMockSupabase({
        shows: [
          { id: "show-1", name: "Today Show", type: "Weekday Show" },
          { id: "show-2", name: "Nightly News", type: "Network" },
        ],
        resources: [
          { id: "r-1", name: "Ava Brooks", role: "TD", phone: "555-0101" },
          { id: "r-2", name: "Blake Stone", role: "TD", phone: "555-0102" },
          { id: "r-3", name: "Chris Vale", role: "TD", phone: "555-0103" },
          { id: "r-4", name: "Dana Rowe", role: "A1", phone: "555-0104" },
        ],
        resource_skills: [
          { resource_id: "r-1", show_id: "show-1", status: "Training" },
          { resource_id: "r-2", show_id: "show-1", status: "Red" },
          { resource_id: "r-3", show_id: "show-1", status: "Active" },
          { resource_id: "r-4", show_id: "show-1", status: "Active" },
          { resource_id: "r-1", show_id: "show-2", status: "Active" },
          { resource_id: "r-2", show_id: "show-2", status: "Red" },
        ],
        backfill_preferences: [
          { show_id: "show-1", role: "TD", resource_id: "r-1", rank: 1, is_permanent_crew: true },
          { show_id: "show-1", role: "TD", resource_id: "r-2", rank: 2, is_permanent_crew: true },
          { show_id: "show-1", role: "TD", resource_id: "r-3", rank: 1, is_permanent_crew: false },
          { show_id: "show-2", role: "TD", resource_id: "r-1", rank: 1, is_permanent_crew: true },
          { show_id: "show-2", role: "TD", resource_id: "r-2", rank: 1, is_permanent_crew: false },
        ],
      })
    );
  });

  it("queries skill records by show/role/status filters", async () => {
    const result = await querySkills({
      showName: "Today Show",
      role: "TD",
      status: "Active",
      includePhone: false,
    });

    expect(result.reason).toBeUndefined();
    expect(result.show).toBe("Today Show");
    expect(result.role).toBe("TD");
    expect(result.matches).toEqual([
      {
        resourceId: "r-3",
        resourceName: "Chris Vale",
        role: "TD",
        showId: "show-1",
        showName: "Today Show",
        status: "Active",
        phone: undefined,
      },
    ]);
  });

  it("returns backfill gap insight with recommended fill candidate", async () => {
    const result = await analyzeBackfillInsights({
      showName: "Today Show",
      role: "TD",
      includePhone: false,
    });

    expect(result.reason).toBeUndefined();
    expect(result.insights).toEqual([
      {
        show: "Today Show",
        role: "TD",
        permanentCount: 2,
        permanentActiveCount: 0,
        backupCount: 1,
        backupActiveCount: 1,
        hasGap: true,
        recommendedFill: {
          resourceId: "r-3",
          resourceName: "Chris Vale",
          rank: 1,
          status: "Active",
          isPermanentCrew: false,
          phone: undefined,
        },
      },
    ]);
  });

  it("supports possessive role terms and returns lowest-backfill show summary", async () => {
    const result = await analyzeBackfillInsights({
      role: "TD's",
      includePhone: false,
    });

    expect(result.role).toBe("TD");
    expect(result.lowestBackfillSummary).toEqual({
      role: "TD",
      metric: "backupActiveCount",
      minimum: 0,
      shows: ["Nightly News"],
      tied: false,
    });
  });
});
