import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ControlRoomMatrixDashboard } from "@/src/components/control-room-matrix-dashboard";
import { MockRoleProvider } from "@/src/components/mock-role-provider";
import type { MatrixPageData } from "@/src/lib/types";

const updateControlRoomSkillActionMock = vi.hoisted(() => vi.fn(async () => ({ ok: true })));

vi.mock("@/src/lib/actions/control-rooms", () => ({
  updateControlRoomSkillAction: (...args: unknown[]) => updateControlRoomSkillActionMock(...args),
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
        "show-1": {
          status: "Active",
          notes: "Confidential note",
        },
      },
      controlRoomSkills: {
        "cr-1": {
          status: "Active",
          notes: "Confidential note",
        },
      },
    },
  ],
};

describe("ControlRoomMatrixDashboard interactions", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    window.localStorage.clear();
    updateControlRoomSkillActionMock.mockResolvedValue({ ok: true });
  });

  it("disables status editing for Read Only", () => {
    window.localStorage.setItem("skills_manager_mock_role", "Read Only");

    render(
      <MockRoleProvider initialRole="Read Only">
        <ControlRoomMatrixDashboard data={data} />
      </MockRoleProvider>
    );

    const statusButton = screen.getByRole("button", {
      name: "Ava Brooks CR1A Active",
    });

    expect(statusButton).toBeDisabled();
    expect(screen.getByText(/Read Only mode/i)).toBeInTheDocument();
  });

  it("allows Read Only to open NOTE popup in view mode", () => {
    window.localStorage.setItem("skills_manager_mock_role", "Read Only");

    render(
      <MockRoleProvider initialRole="Read Only">
        <ControlRoomMatrixDashboard data={data} />
      </MockRoleProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open note for Ava Brooks on CR1A" }));

    expect(screen.getByRole("dialog", { name: "NOTE" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Confidential note")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Save NOTE" })).toBeNull();
  });

  it("opens status menu and updates to any selected status", async () => {
    window.localStorage.setItem("skills_manager_mock_role", "Manager");

    render(
      <MockRoleProvider initialRole="Manager">
        <ControlRoomMatrixDashboard data={data} />
      </MockRoleProvider>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ava Brooks CR1A Active",
      })
    );

    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Set Ava Brooks on CR1A to Training",
      })
    );

    await waitFor(() => {
      expect(updateControlRoomSkillActionMock).toHaveBeenCalledWith({
        resourceId: "resource-1",
        controlRoomId: "cr-1",
        status: "Training",
        notes: "Confidential note",
        mockRole: "Manager",
      });
    });

    expect(
      screen.getByRole("button", {
        name: "Ava Brooks CR1A Training",
      })
    ).toBeInTheDocument();
  });
});
