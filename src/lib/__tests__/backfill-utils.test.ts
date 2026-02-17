import { describe, expect, it } from "vitest";
import { moveItemBetweenLists, normalizeRankedIds } from "@/src/lib/backfill-utils";

describe("normalizeRankedIds", () => {
  it("removes duplicates while preserving order", () => {
    expect(normalizeRankedIds(["a", "b", "a", "c", "b"]))
      .toEqual(["a", "b", "c"]);
  });
});

describe("moveItemBetweenLists", () => {
  it("moves item to the target list at a specific position", () => {
    const result = moveItemBetweenLists(["a", "b"], ["x", "y"], "b", 1);

    expect(result.source).toEqual(["a"]);
    expect(result.target).toEqual(["x", "b", "y"]);
  });
});
