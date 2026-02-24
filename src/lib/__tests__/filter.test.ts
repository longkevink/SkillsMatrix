import { describe, expect, it } from "vitest";
import { filterResources } from "@/src/lib/filter";
import type { DashboardResource } from "@/src/lib/types";

const resources: DashboardResource[] = [
  {
    id: "r1",
    name: "Ava Brooks",
    role: "TD",
    controlRoomSkills: {},
    skills: {
      s1: { status: "Active", notes: null },
    },
  },
  {
    id: "r2",
    name: "Liam Carter",
    role: "A1",
    controlRoomSkills: {},
    skills: {
      s1: { status: "Refresh", notes: null },
    },
  },
  {
    id: "r3",
    name: "Mia Perez",
    role: "TD",
    controlRoomSkills: {},
    skills: {
      s1: { status: "Red", notes: "Blocked" },
    },
  },
  {
    id: "r4",
    name: "No Skill User",
    role: "A2",
    controlRoomSkills: {},
    skills: {},
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

    expect(result).toHaveLength(4);
  });

  it("does not include explicit non-NA skills when filtering NA without a show", () => {
    const result = filterResources(resources, {
      selectedRoles: [],
      search: "",
      capabilityShowId: null,
      capabilityStatuses: ["NA"],
    });

    expect(result.map((resource) => resource.id)).toEqual(["r4"]);
  });

  it("treats missing skill for selected show as NA", () => {
    const result = filterResources(resources, {
      selectedRoles: [],
      search: "",
      capabilityShowId: "s2",
      capabilityStatuses: ["NA"],
    });

    expect(result.map((resource) => resource.id)).toEqual(["r1", "r2", "r3", "r4"]);
  });
});
