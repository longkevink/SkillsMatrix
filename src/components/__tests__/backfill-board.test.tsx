import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { BackfillBoard } from "@/src/components/backfill-board";
import { MockRoleProvider } from "@/src/components/mock-role-provider";
import type { BackfillPageData } from "@/src/lib/types";

const reorderBackfillActionMock = vi.hoisted(() => vi.fn(async () => ({ ok: true })));

const dndState = vi.hoisted(() => {
  let event: { active: { id: string }; over: { id: string } | null } | null = null;

  return {
    setEvent(next: { active: { id: string }; over: { id: string } | null }) {
      event = next;
    },
    getEvent() {
      return event;
    },
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/src/lib/actions/backfill", () => ({
  reorderBackfillAction: (...args: unknown[]) => reorderBackfillActionMock(...args),
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children, onDragEnd }: { children: ReactNode; onDragEnd: (event: unknown) => void }) => (
    <div>
      <button
        type="button"
        data-testid="trigger-dnd"
        onClick={() => {
          const event = dndState.getEvent();
          if (event) {
            onDragEnd(event);
          }
        }}
      >
        Trigger DnD
      </button>
      {children}
    </div>
  ),
  PointerSensor: class {},
  KeyboardSensor: class {},
  closestCenter: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false })),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: ReactNode }) => <>{children}</>,
  arrayMove: (arr: string[], from: number, to: number) => {
    const next = [...arr];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  },
  sortableKeyboardCoordinates: vi.fn(),
  useSortable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: undefined,
    isDragging: false,
  })),
  verticalListSortingStrategy: vi.fn(),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: {
    Transform: {
      toString: () => "",
    },
  },
}));

const data: BackfillPageData = {
  selectedShow: { id: "show-1", name: "Nightly News", type: "Network" },
  shows: [{ id: "show-1", name: "Nightly News", type: "Network" }],
  roles: [
    {
      role: "TD",
      permanentCrew: [
        { id: "bp-1", resourceId: "r-1", resourceName: "Ava Brooks", rank: 1, isPermanentCrew: true },
        { id: "bp-2", resourceId: "r-2", resourceName: "Blake Stone", rank: 2, isPermanentCrew: true },
      ],
      backupList: [
        { id: "bp-3", resourceId: "r-3", resourceName: "Chris Vale", rank: 1, isPermanentCrew: false },
      ],
    },
  ],
};

describe("BackfillBoard drag persistence", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("saves reordered list when dragging within the same list", async () => {
    window.localStorage.setItem("skills_manager_mock_role", "Manager");

    render(
      <MockRoleProvider initialRole="Manager">
        <BackfillBoard data={data} />
      </MockRoleProvider>
    );

    dndState.setEvent({ active: { id: "r-2" }, over: { id: "r-1" } });
    fireEvent.click(screen.getByTestId("trigger-dnd"));

    await waitFor(() => {
      expect(reorderBackfillActionMock).toHaveBeenCalledWith({
        showId: "show-1",
        role: "TD",
        permanentResourceIds: ["r-2", "r-1"],
        backupResourceIds: ["r-3"],
        mockRole: "Manager",
      });
    });
  });

  it("saves moved item when dragging across permanent and backup lists", async () => {
    window.localStorage.setItem("skills_manager_mock_role", "Manager");

    render(
      <MockRoleProvider initialRole="Manager">
        <BackfillBoard data={data} />
      </MockRoleProvider>
    );

    dndState.setEvent({ active: { id: "r-2" }, over: { id: "backup" } });
    fireEvent.click(screen.getByTestId("trigger-dnd"));

    await waitFor(() => {
      expect(reorderBackfillActionMock).toHaveBeenCalledWith({
        showId: "show-1",
        role: "TD",
        permanentResourceIds: ["r-1"],
        backupResourceIds: ["r-3", "r-2"],
        mockRole: "Manager",
      });
    });
  });

  it("reverts to last confirmed order on save failure", async () => {
    reorderBackfillActionMock.mockResolvedValueOnce({ ok: false, error: "RPC fail" });
    window.localStorage.setItem("skills_manager_mock_role", "Manager");

    render(
      <MockRoleProvider initialRole="Manager">
        <BackfillBoard data={data} />
      </MockRoleProvider>
    );

    dndState.setEvent({ active: { id: "r-2" }, over: { id: "backup" } });
    fireEvent.click(screen.getByTestId("trigger-dnd"));

    await waitFor(() => {
      expect(screen.getByText(/Save failed/i)).toBeInTheDocument();
    });

    const permanentSection = document.getElementById("permanent");
    const backupSection = document.getElementById("backup");

    expect(permanentSection).toBeTruthy();
    expect(backupSection).toBeTruthy();

    if (permanentSection && backupSection) {
      expect(within(permanentSection).getByText("Blake Stone")).toBeInTheDocument();
      expect(within(backupSection).queryByText("Blake Stone")).toBeNull();
    }
  });
});
