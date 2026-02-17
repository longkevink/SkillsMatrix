import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MatrixDashboard } from "@/src/components/matrix-dashboard";
import { MockRoleProvider } from "@/src/components/mock-role-provider";
import type { DashboardData } from "@/src/lib/types";

const updateSkillActionMock = vi.hoisted(() => vi.fn(async () => ({ ok: true })));

vi.mock("@/src/lib/actions/skills", () => ({
  updateSkillAction: (...args: unknown[]) => updateSkillActionMock(...args),
}));

const data: DashboardData = {
  shows: [{ id: "show-1", name: "Nightly News", type: "Network" }],
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
      controlRoomSkills: {},
    },
  ],
};

describe("MatrixDashboard interactions", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  beforeEach(() => {
    window.localStorage.clear();
    updateSkillActionMock.mockResolvedValue({ ok: true });
  });

  it("disables status editing for Read Only", () => {
    window.localStorage.setItem("skills_manager_mock_role", "Read Only");

    render(
      <MockRoleProvider initialRole="Read Only">
        <MatrixDashboard data={data} />
      </MockRoleProvider>
    );

    const statusButton = screen.getByRole("button", {
      name: "Ava Brooks Nightly News Active",
    });

    expect(statusButton).toBeDisabled();
    expect(screen.getByText(/Read Only mode/i)).toBeInTheDocument();
  });

  it("allows Read Only to open NOTE popup in view mode", () => {
    window.localStorage.setItem("skills_manager_mock_role", "Read Only");

    render(
      <MockRoleProvider initialRole="Read Only">
        <MatrixDashboard data={data} />
      </MockRoleProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open note for Ava Brooks on Nightly News" }));

    expect(screen.getByRole("dialog", { name: "NOTE" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Confidential note")).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Save NOTE" })).toBeNull();
  });

  it("opens status menu and updates to any selected status", async () => {
    window.localStorage.setItem("skills_manager_mock_role", "Manager");

    render(
      <MockRoleProvider initialRole="Manager">
        <MatrixDashboard data={data} />
      </MockRoleProvider>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ava Brooks Nightly News Active",
      })
    );

    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Set Ava Brooks on Nightly News to Training",
      })
    );

    await waitFor(() => {
      expect(updateSkillActionMock).toHaveBeenCalledWith({
        resourceId: "resource-1",
        showId: "show-1",
        status: "Training",
        notes: "Confidential note",
        mockRole: "Manager",
      });
    });

    expect(
      screen.getByRole("button", {
        name: "Ava Brooks Nightly News Training",
      })
    ).toBeInTheDocument();
  });

  it("rolls back optimistic status when save fails", async () => {
    updateSkillActionMock.mockResolvedValueOnce({ ok: false, error: "DB down" });
    window.localStorage.setItem("skills_manager_mock_role", "Manager");

    render(
      <MockRoleProvider initialRole="Manager">
        <MatrixDashboard data={data} />
      </MockRoleProvider>
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Ava Brooks Nightly News Active",
      })
    );

    fireEvent.click(
      screen.getByRole("menuitem", {
        name: "Set Ava Brooks on Nightly News to NA",
      })
    );

    expect(
      screen.getByRole("button", {
        name: "Ava Brooks Nightly News NA",
      })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Ava Brooks Nightly News Active",
        })
      ).toBeInTheDocument();
      expect(screen.getByText(/Could not update Ava Brooks/i)).toBeInTheDocument();
    });
  });

  it("opens notes editor for editable roles", () => {
    window.localStorage.setItem("skills_manager_mock_role", "Manager");

    render(
      <MockRoleProvider initialRole="Manager">
        <MatrixDashboard data={data} />
      </MockRoleProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open note for Ava Brooks on Nightly News" }));

    expect(screen.getByRole("dialog", { name: "NOTE" })).toBeInTheDocument();
    expect(screen.getByDisplayValue("Confidential note")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save NOTE" })).toBeInTheDocument();
  });
});
