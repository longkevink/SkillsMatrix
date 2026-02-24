import { beforeEach, describe, expect, it, vi } from "vitest";

const getSupabaseAdminClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/src/lib/supabase/admin", () => ({
  getSupabaseAdminClient: (...args: unknown[]) => getSupabaseAdminClientMock(...args),
}));

import { analyzeRoleCoverage } from "@/src/lib/chat/query-service";

type TableName = "shows" | "resources" | "resource_skills";

interface Row {
  [key: string]: string;
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

  eq(field: string, value: string) {
    this.filters.push((row) => row[field] === value);
    return this;
  }

  in(field: string, values: string[]) {
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

describe("analyzeRoleCoverage", () => {
  beforeEach(() => {
    getSupabaseAdminClientMock.mockReset();

    getSupabaseAdminClientMock.mockReturnValue(
      createMockSupabase({
        shows: [
          { id: "show-today", name: "Today Show", type: "Weekday Show" },
          { id: "show-nn", name: "Nightly News", type: "Network" },
        ],
        resources: [
          { id: "r-1", role: "TD" },
          { id: "r-2", role: "TD" },
          { id: "r-3", role: "A1" },
          { id: "r-4", role: "A1" },
          { id: "r-5", role: "GFX Op" },
        ],
        resource_skills: [
          { resource_id: "r-1", show_id: "show-today", status: "Active" },
          { resource_id: "r-2", show_id: "show-today", status: "Training" },
          { resource_id: "r-3", show_id: "show-today", status: "Active" },
          { resource_id: "r-4", show_id: "show-today", status: "Red" },
          { resource_id: "r-5", show_id: "show-today", status: "NA" },
          { resource_id: "r-1", show_id: "show-nn", status: "Active" },
          { resource_id: "r-2", show_id: "show-nn", status: "Active" },
          { resource_id: "r-3", show_id: "show-nn", status: "Refresh" },
          { resource_id: "r-4", show_id: "show-nn", status: "Active" },
          { resource_id: "r-5", show_id: "show-nn", status: "Active" },
        ],
      })
    );
  });

  it("returns least-active role for a specific show with full status counts", async () => {
    const result = await analyzeRoleCoverage({ showName: "Today Show" });

    expect(result.scope).toBe("single_show");
    expect(result.show).toBe("Today Show");

    expect(result.roleBreakdown).toEqual(
      expect.arrayContaining([
        {
          role: "TD",
          active: 1,
          training: 1,
          refresh: 0,
          na: 0,
          red: 0,
          total: 2,
        },
        {
          role: "A1",
          active: 1,
          training: 0,
          refresh: 0,
          na: 0,
          red: 1,
          total: 2,
        },
        {
          role: "GFX Op",
          active: 0,
          training: 0,
          refresh: 0,
          na: 1,
          red: 0,
          total: 1,
        },
      ])
    );

    expect(result.leastActiveRoles).toEqual([
      {
        role: "GFX Op",
        active: 0,
        training: 0,
        refresh: 0,
        na: 1,
        red: 0,
        total: 1,
      },
    ]);
  });

  it("supports all-show coverage mode", async () => {
    const result = await analyzeRoleCoverage({});

    expect(result.scope).toBe("all_shows");
    expect(result.show).toBeNull();

    const td = result.roleBreakdown.find((row) => row.role === "TD");
    expect(td).toEqual({
      role: "TD",
      active: 3,
      training: 1,
      refresh: 0,
      na: 0,
      red: 0,
      total: 4,
    });

    const leastRoles = result.leastActiveRoles.map((row) => row.role);
    expect(leastRoles).toContain("GFX Op");
  });
});
