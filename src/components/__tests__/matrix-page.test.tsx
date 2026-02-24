import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MatrixPage } from "@/src/components/matrix-page";
import { MockRoleProvider } from "@/src/components/mock-role-provider";
import type { MatrixPageData } from "@/src/lib/types";

vi.mock("@/src/lib/actions/skills", () => ({
  updateSkillAction: async () => ({ ok: true }),
}));

vi.mock("@/src/lib/actions/control-rooms", () => ({
  updateControlRoomSkillAction: async () => ({ ok: true }),
}));

vi.mock("@/src/lib/actions/resources", () => ({
  addResourceAction: async () => ({ ok: true }),
}));

const data: MatrixPageData = {
  shows: [{ id: "show-1", name: "Nightly News", type: "Network" }],
  controlRooms: [{ id: "cr-1", code: "CR1A" }],
  resources: [
    {
      id: "resource-1",
      name: "Ava Brooks",
      role: "TD",
      skills: {
        "show-1": { status: "Active", notes: null },
      },
      controlRoomSkills: {
        "cr-1": { status: "Active", notes: null },
      },
    },
  ],
};

describe("MatrixPage", () => {
  it("renders both tabs and switches between views", () => {
    render(
      <MockRoleProvider initialRole="Read Only">
        <MatrixPage data={data} />
      </MockRoleProvider>
    );

    expect(screen.getByRole("tab", { name: "Shows" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Skills" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Skills" }));

    expect(screen.getByText("Control Room Skill")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "CR1A" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Shows" }));

    expect(screen.getByText("Filter by show")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Nightly News/i })).toBeInTheDocument();
  });
});
