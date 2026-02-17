"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { reorderBackfillAction } from "@/src/lib/actions/backfill";
import { canEdit } from "@/src/lib/mock-role";
import { useMockRole } from "@/src/components/mock-role-provider";
import { DensityToolbar } from "@/src/components/premium/density-toolbar";
import { InlineStatusDot } from "@/src/components/premium/inline-status-dot";
import { SortableResourceItem } from "@/src/components/backfill/sortable-resource-item";
import { DroppableContainer } from "@/src/components/backfill/droppable-container";
import { uiFeatureFlags } from "@/src/lib/ui/feature-flags";
import type { BackfillPageData, SkillStatus } from "@/src/lib/types";
import { cn } from "@/src/lib/utils";

interface BackfillBoardProps {
  data: BackfillPageData;
}

interface RoleLists {
  permanent: string[];
  backup: string[];
}

export function BackfillBoard({ data }: BackfillBoardProps) {
  const router = useRouter();
  const { mockRole } = useMockRole();
  const editable = canEdit(mockRole);
  const premium = uiFeatureFlags.premiumOperationsEnabled;
  const [isPending, startTransition] = useTransition();
  const [saveMessage, setSaveMessage] = useState<string>("");
  const [saveTone, setSaveTone] = useState<"neutral" | "success" | "error">("neutral");
  const [activeRole, setActiveRole] = useState(data.roles[0]?.role ?? "");
  const [search, setSearch] = useState("");
  const [openContactByRole, setOpenContactByRole] = useState<Record<string, string | null>>({});

  const initialRoleLists = useMemo(() => {
    return data.roles.reduce<Record<string, RoleLists>>((acc, roleData) => {
      acc[roleData.role] = {
        permanent: roleData.permanentCrew.map((entry) => entry.resourceId),
        backup: roleData.backupList.map((entry) => entry.resourceId),
      };
      return acc;
    }, {});
  }, [data.roles]);

  const [roleLists, setRoleLists] = useState<Record<string, RoleLists>>(initialRoleLists);
  const [, setConfirmedRoleLists] = useState<Record<string, RoleLists>>(initialRoleLists);
  const confirmedRoleListsRef = useRef<Record<string, RoleLists>>(initialRoleLists);

  const nameById = useMemo(() => {
    const names = new Map<string, string>();
    const statuses = new Map<string, SkillStatus>();
    for (const roleData of data.roles) {
      for (const entry of roleData.permanentCrew) {
        names.set(entry.resourceId, entry.resourceName);
        statuses.set(entry.resourceId, entry.status);
      }
      for (const entry of roleData.backupList) {
        names.set(entry.resourceId, entry.resourceName);
        statuses.set(entry.resourceId, entry.status);
      }
    }
    return { names, statuses };
  }, [data.roles]);

  const activeLists = roleLists[activeRole] ?? { permanent: [], backup: [] };
  const searchValue = search.trim().toLowerCase();

  const visiblePermanent = useMemo(
    () =>
      activeLists.permanent.filter((id) => {
        if (!searchValue) {
          return true;
        }

        const name = nameById.names.get(id) ?? "";
        return name.toLowerCase().includes(searchValue);
      }),
    [activeLists.permanent, nameById.names, searchValue]
  );

  const visibleBackup = useMemo(
    () =>
      activeLists.backup.filter((id) => {
        if (!searchValue) {
          return true;
        }

        const name = nameById.names.get(id) ?? "";
        return name.toLowerCase().includes(searchValue);
      }),
    [activeLists.backup, nameById.names, searchValue]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findContainer = (id: string): "permanent" | "backup" | null => {
    if (id === "permanent" || id === "backup") {
      return id;
    }

    if (activeLists.permanent.includes(id)) {
      return "permanent";
    }

    if (activeLists.backup.includes(id)) {
      return "backup";
    }

    return null;
  };

  const persistRoleLists = (nextLists: RoleLists, role: string) => {
    startTransition(async () => {
      const result = await reorderBackfillAction({
        showId: data.selectedShow.id,
        role,
        permanentResourceIds: nextLists.permanent,
        backupResourceIds: nextLists.backup,
        mockRole,
      });

      if (!result.ok) {
        setRoleLists((prev) => {
          const confirmed = confirmedRoleListsRef.current[role] ?? { permanent: [], backup: [] };
          return { ...prev, [role]: confirmed };
        });
        setSaveTone("error");
        setSaveMessage(`Save failed: ${result.error}`);
        return;
      }

      setConfirmedRoleLists((prev) => {
        const next = { ...prev, [role]: nextLists };
        confirmedRoleListsRef.current = next;
        return next;
      });
      setSaveTone("success");
      setSaveMessage(`Saved ${role} at ${new Date().toLocaleTimeString()}`);
    });
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (!editable) {
      return;
    }

    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    if (!overId) {
      return;
    }

    const sourceContainer = findContainer(activeId);
    const targetContainer = findContainer(overId);

    if (!sourceContainer || !targetContainer) {
      return;
    }

    const currentLists = roleLists[activeRole] ?? { permanent: [], backup: [] };
    const nextLists: RoleLists = {
      permanent: [...currentLists.permanent],
      backup: [...currentLists.backup],
    };

    if (sourceContainer === targetContainer) {
      const sourceList = nextLists[sourceContainer];
      const fromIndex = sourceList.indexOf(activeId);
      const toIndex = overId === sourceContainer ? sourceList.length - 1 : sourceList.indexOf(overId);

      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
        return;
      }

      nextLists[sourceContainer] = arrayMove(sourceList, fromIndex, toIndex);
    } else {
      const sourceList = nextLists[sourceContainer];
      const targetList = nextLists[targetContainer];
      const sourceIndex = sourceList.indexOf(activeId);

      if (sourceIndex === -1) {
        return;
      }

      sourceList.splice(sourceIndex, 1);

      const targetIndex = overId === targetContainer ? targetList.length : targetList.indexOf(overId);
      const safeTargetIndex = targetIndex < 0 ? targetList.length : targetIndex;
      targetList.splice(safeTargetIndex, 0, activeId);
    }

    setSaveTone("neutral");
    setSaveMessage("Saving...");
    setRoleLists((prev) => ({ ...prev, [activeRole]: nextLists }));
    persistRoleLists(nextLists, activeRole);
  };

  return (
    <div className="space-y-3">
      {premium ? (
        <DensityToolbar
          title="Backfill Command Board"
          detail={`${data.selectedShow.name} | ${activeRole || "Select role"} priority ordering`}
        >
          <InlineStatusDot tone="success" label="Ready" />
          <InlineStatusDot tone="warning" label="Training" />
          <InlineStatusDot tone="danger" label="Red" />
        </DensityToolbar>
      ) : null}

      <section
        className={cn(
          "rounded-xl border p-3 shadow-sm",
          premium
            ? "border-[color:var(--border-subtle)] bg-[color:var(--surface-1)]"
            : "border-slate-200 bg-white"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
            Show
            <select
              value={data.selectedShow.id}
              onChange={(event) => router.push(`/backfill/${event.target.value}`)}
              className="ml-2 rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] px-2 py-1.5 text-sm text-[color:var(--text-strong)]"
            >
              {data.shows.map((show) => (
                <option key={show.id} value={show.id}>
                  {show.name}
                </option>
              ))}
            </select>
          </label>

          <span className="rounded-full border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
            {data.selectedShow.type}
          </span>

          <label className="ml-auto flex w-full max-w-xs flex-col gap-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[color:var(--text-muted)] md:w-auto">
            Search crew
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter active role list"
              className="rounded-md border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-2.5 py-1.5 text-sm font-medium normal-case tracking-normal text-[color:var(--text-strong)]"
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {data.roles.map((roleData) => (
            <button
              key={roleData.role}
              type="button"
              onClick={() => setActiveRole(roleData.role)}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em]",
                roleData.role === activeRole
                  ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                  : "border-[color:var(--border-subtle)] bg-[color:var(--surface-1)] text-[color:var(--text-muted)] hover:border-[color:var(--border-strong)]"
              )}
            >
              {roleData.role}
            </button>
          ))}
        </div>
      </section>

      <div
        className={cn(
          "sticky top-[54px] z-30 rounded-md border px-3 py-2 text-xs font-semibold",
          saveTone === "success" && "border-emerald-200 bg-emerald-50 text-emerald-700",
          saveTone === "error" && "border-red-200 bg-red-50 text-red-700",
          saveTone === "neutral" && "border-[color:var(--border-strong)] bg-[#0f2137] text-white"
        )}
      >
        {editable ? "Manager/Admin mode: edits enabled." : "Read Only mode: drag-and-drop disabled."}
        {isPending ? " Saving..." : ""}
        {saveMessage ? ` ${saveMessage}` : " Drag and drop to reprioritize."}
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <section className="grid gap-3 lg:grid-cols-2">
          <div>
            <SortableContext items={visiblePermanent} strategy={verticalListSortingStrategy}>
              <DroppableContainer
                id="permanent"
                title="Permanent"
                count={activeLists.permanent.length}
                emptyMessage="No permanent crew selected for this role."
                isFilteredEmpty={Boolean(activeLists.permanent.length) && visiblePermanent.length === 0}
              >
                <ul className="space-y-1.5">
                  {visiblePermanent.map((resourceId) => (
                    <SortableResourceItem
                      key={resourceId}
                      id={resourceId}
                      name={nameById.names.get(resourceId) ?? "Unknown"}
                      status={nameById.statuses.get(resourceId) ?? "NA"}
                      disabled={!editable}
                      contactOpen={openContactByRole[activeRole] === resourceId}
                      onToggleContact={(id) =>
                        setOpenContactByRole((prev) => ({
                          ...prev,
                          [activeRole]: prev[activeRole] === id ? null : id,
                        }))
                      }
                    />
                  ))}
                </ul>
              </DroppableContainer>
            </SortableContext>
          </div>

          <div>
            <SortableContext items={visibleBackup} strategy={verticalListSortingStrategy}>
              <DroppableContainer
                id="backup"
                title="Backup"
                count={activeLists.backup.length}
                emptyMessage="No backups listed for this role."
                isFilteredEmpty={Boolean(activeLists.backup.length) && visibleBackup.length === 0}
              >
                <ul className="space-y-1.5">
                  {visibleBackup.map((resourceId) => (
                    <SortableResourceItem
                      key={resourceId}
                      id={resourceId}
                      name={nameById.names.get(resourceId) ?? "Unknown"}
                      status={nameById.statuses.get(resourceId) ?? "NA"}
                      disabled={!editable}
                      contactOpen={openContactByRole[activeRole] === resourceId}
                      onToggleContact={(id) =>
                        setOpenContactByRole((prev) => ({
                          ...prev,
                          [activeRole]: prev[activeRole] === id ? null : id,
                        }))
                      }
                    />
                  ))}
                </ul>
              </DroppableContainer>
            </SortableContext>
          </div>
        </section>
      </DndContext>
    </div>
  );
}
