import { beforeEach, describe, expect, it, vi } from "vitest";

const getSupabaseAdminClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/src/lib/supabase/admin", () => ({
  getSupabaseAdminClient: (...args: unknown[]) => getSupabaseAdminClientMock(...args),
}));

import { resolveShowAndRole } from "@/src/lib/chat/query-service";

type TableName = "shows" | "resources" | "term_aliases";
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

describe("resolveShowAndRole confidence", () => {
  beforeEach(() => {
    getSupabaseAdminClientMock.mockReset();
    process.env.CHAT_ALIAS_V2 = "true";

    getSupabaseAdminClientMock.mockReturnValue(
      createMockSupabase({
        shows: [
          { id: "show-1", name: "Nightly News", type: "Network" },
          { id: "show-2", name: "NND 12p-4p", type: "News Now" },
          { id: "show-3", name: "NNN Hallie", type: "News Now" },
          { id: "show-4", name: "Specials Standby", type: "Control Room" },
          { id: "show-5", name: "Today Show", type: "Weekday Show" },
          { id: "show-6", name: "4th Hour Today", type: "Weekday Show" },
        ],
        resources: [{ role: "TD" }, { role: "A1" }, { role: "GFX Op" }],
        term_aliases: [
          {
            alias: "nnn",
            canonical_value: "NND 12p-4p",
            entity_type: "show",
            confidence_override: 0.9,
            is_active: true,
          },
          {
            alias: "sr",
            canonical_value: "Specials Standby",
            entity_type: "show",
            confidence_override: 0.99,
            is_active: true,
          },
          {
            alias: "tdy",
            canonical_value: "Today Show",
            entity_type: "show",
            confidence_override: 0.99,
            is_active: true,
          },
        ],
      })
    );
  });

  it("uses alias table mappings for locked shorthand", async () => {
    const result = await resolveShowAndRole({ showName: "SR", role: "TD" });

    expect(result.show?.name).toBe("Specials Standby");
    expect(result.showResolution.stage).toBe("alias_exact");
    expect(result.showResolution.confidence).toBeGreaterThanOrEqual(0.95);
  });

  it("maps NNN to NND 12p-4p per policy", async () => {
    const result = await resolveShowAndRole({ showName: "NNN", role: "TD" });

    expect(result.show?.name).toBe("NND 12p-4p");
    expect(result.showResolution.needsClarification).toBe(false);
  });

  it("asks for clarification when confidence is low", async () => {
    const result = await resolveShowAndRole({ showName: "n", role: "TD" });

    expect(result.show).toBeNull();
    expect(result.showResolution.needsClarification).toBe(true);
    expect(result.showResolution.candidates.length).toBeGreaterThan(0);
    expect(result.showResolution.clarificationPrompt).toBeTruthy();
  });
});
