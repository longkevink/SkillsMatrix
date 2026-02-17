import { describe, expect, it } from "vitest";
import { buildSeedDataset, buildStatusDistribution } from "@/supabase/seed/generator";

const input = {
  roles: ["TD", "A1"],
  shows: [
    { name: "Nightly News", type: "Network" },
    { name: "Today Show", type: "Weekday" },
  ],
  namePools: {
    firstNames: ["Ava", "Liam", "Mia", "Noah", "Sophia", "Ethan"],
    lastNames: ["Brooks", "Carter", "Perez", "Bennett", "Hayes", "Foster"],
  },
  resourcesPerRole: 8,
  seed: 1234,
};

describe("buildSeedDataset", () => {
  it("is deterministic for a fixed seed", () => {
    const firstRun = buildSeedDataset(input);
    const secondRun = buildSeedDataset(input);

    expect(firstRun.resources).toEqual(secondRun.resources);
    expect(firstRun.skills).toEqual(secondRun.skills);
    expect(firstRun.backfillGroups).toEqual(secondRun.backfillGroups);
  });

  it("creates a dense resource/show matrix", () => {
    const dataset = buildSeedDataset(input);
    const expectedSkillCount = dataset.resources.length * dataset.shows.length;

    expect(dataset.skills).toHaveLength(expectedSkillCount);
  });

  it("roughly follows the weighted status distribution", () => {
    const dataset = buildSeedDataset({
      ...input,
      resourcesPerRole: 100,
    });

    const distribution = buildStatusDistribution(dataset.skills);
    const total = dataset.skills.length;

    const activePct = (distribution.Active / total) * 100;
    const naPct = (distribution.NA / total) * 100;

    expect(activePct).toBeGreaterThan(35);
    expect(activePct).toBeLessThan(55);
    expect(naPct).toBeGreaterThan(30);
    expect(naPct).toBeLessThan(50);
  });
});
