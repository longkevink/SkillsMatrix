import { describe, expect, it } from "vitest";
import { filterResources } from "@/src/lib/filter";
import type { DashboardResource } from "@/src/lib/types";

const resources: DashboardResource[] = [
  {
    id: "r1",
    name: "Ava Brooks",
    role: "TD",
    skills: {
      s1: { status: "Active", notes: null },
    },
  },
  {
    id: "r2",
    name: "Liam Carter",
    role: "A1",
    skills: {
      s1: { status: "Refresh", notes: null },
    },
  },
  {
    id: "r3",
    name: "Mia Perez",
    role: "TD",
    skills: {
      s1: { status: "Red", notes: "Blocked" },
    },
  },
];

describe("filterResources", () => {
  it("filters by selected roles", () => {
    const result = filterResources(resources, {
      selectedRoles: ["TD"],
      search: "",
      capabilityShowId: null,
      capabilityStatuses: [],
    });

    expect(result.map((resource) => resource.id)).toEqual(["r1", "r3"]);
  });

  it("filters by search and capability", () => {
    const result = filterResources(resources, {
      selectedRoles: [],
      search: "liam",
      capabilityShowId: "s1",
      capabilityStatuses: ["Active", "Refresh"],
    });

    expect(result.map((resource) => resource.id)).toEqual(["r2"]);
  });

  it("returns all resources when filters are empty", () => {
    const result = filterResources(resources, {
      selectedRoles: [],
      search: "",
      capabilityShowId: null,
      capabilityStatuses: [],
    });

    expect(result).toHaveLength(3);
  });
});
