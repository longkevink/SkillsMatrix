"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { updateSkillAction } from "@/src/lib/actions/skills";
import { removeResourceAction } from "@/src/lib/actions/resources";
import { AddUserDialog } from "@/src/components/matrix/add-user-dialog";
import { EditUserDialog } from "@/src/components/matrix/edit-user-dialog";
import { CellEditorDialog } from "@/src/components/cell-editor-dialog";
import { SKILL_STATUSES } from "@/src/lib/constants";
import { canEdit, canViewNotes } from "@/src/lib/mock-role";
import { useMockRole } from "@/src/components/mock-role-provider";
import { uiFeatureFlags } from "@/src/lib/ui/feature-flags";
import { filterResources } from "@/src/lib/filter";
import { groupByRole, getCellSkill } from "@/src/lib/matrix-utils";
import { MatrixFilterToolbar } from "@/src/components/matrix/matrix-filter-toolbar";
import { StatusCell } from "@/src/components/matrix/status-cell";
import { RoleGroupHeader } from "@/src/components/matrix/role-group-header";
import type { DashboardData, DashboardResource, SkillStatus } from "@/src/lib/types";
import { cn } from "@/src/lib/utils";

interface MatrixDashboardProps {
  data: DashboardData;
}

interface ActiveCell {
  resourceId: string;
  showId: string;
  resourceName: string;
  showName: string;
  status: SkillStatus;
  notes: string;
}

export function MatrixDashboard({ data }: MatrixDashboardProps) {
  const { mockRole } = useMockRole();
  const editable = canEdit(mockRole);
  const notesVisible = canViewNotes(mockRole);
  const premium = uiFeatureFlags.premiumOperationsEnabled;

  const [resources, setResources] = useState(data.resources);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [capabilityShowId, setCapabilityShowId] = useState<string>("");
  const [capabilityStatuses, setCapabilityStatuses] = useState<SkillStatus[]>([...SKILL_STATUSES]);
  const [collapsedRoles, setCollapsedRoles] = useState<string[]>([]);
  const [activeCell, setActiveCell] = useState<ActiveCell | null>(null);
  const [savingCells, setSavingCells] = useState<Record<string, boolean>>({});
  const [openStatusMenuKey, setOpenStatusMenuKey] = useState<string | null>(null);
  const [openResourceMenuId, setOpenResourceMenuId] = useState<string | null>(null);
  const [resourceMenuPosition, setResourceMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [isNotesSaving, setIsNotesSaving] = useState(false);
  const [removingResourceIds, setRemovingResourceIds] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [addUserRole, setAddUserRole] = useState<string | null>(null);
  const [editResource, setEditResource] = useState<{ id: string; name: string; role: string; phone?: string } | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!boardRef.current) {
        return;
      }

      if (!boardRef.current.contains(event.target as Node)) {
        setOpenStatusMenuKey(null);
        setOpenResourceMenuId(null);
        setResourceMenuPosition(null);
        return;
      }

      const target = event.target as HTMLElement;
      const clickedResourceMenu = target.closest("[data-resource-menu]");
      const clickedResourceMenuTrigger = target.closest("[data-resource-menu-trigger]");
      if (!clickedResourceMenu && !clickedResourceMenuTrigger) {
        setOpenResourceMenuId(null);
        setResourceMenuPosition(null);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
    };
  }, []);

  const roles = useMemo(() => [...new Set(resources.map((resource) => resource.role))].sort(), [resources]);

  const filteredResources = useMemo(
    () =>
      filterResources(resources, {
        selectedRoles,
        search,
        capabilityShowId: capabilityShowId || null,
        capabilityStatuses,
      }),
    [resources, selectedRoles, search, capabilityShowId, capabilityStatuses]
  );

  const filteredShows = useMemo(() => {
    if (!capabilityShowId) {
      return data.shows;
    }
    return data.shows.filter((show) => show.id === capabilityShowId);
  }, [data.shows, capabilityShowId]);

  const groupedResources = useMemo(() => groupByRole(filteredResources), [filteredResources]);

  const toggleRoleFilter = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]
    );
  };

  const toggleCapabilityStatus = (status: SkillStatus) => {
    setCapabilityStatuses((prev) =>
      prev.includes(status) ? prev.filter((item) => item !== status) : [...prev, status]
    );
  };

  const toggleRoleCollapse = (role: string) => {
    setCollapsedRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]
    );
  };

  const withSkillUpdated = (
    list: DashboardResource[],
    resourceId: string,
    showId: string,
    status: SkillStatus,
    notes: string | null
  ) => {
    return list.map((resource) => {
      if (resource.id !== resourceId) {
        return resource;
      }

      return {
        ...resource,
        skills: {
          ...resource.skills,
          [showId]: {
            status,
            notes,
          },
        },
      };
    });
  };

  const saveStatusUpdate = async (
    resource: DashboardResource,
    showId: string,
    showName: string,
    previousStatus: SkillStatus,
    previousNotes: string | null,
    nextStatus: SkillStatus
  ) => {
    const cellKey = `${resource.id}:${showId}`;

    setSavingCells((prev) => ({ ...prev, [cellKey]: true }));

    const result = await updateSkillAction({
      resourceId: resource.id,
      showId,
      status: nextStatus,
      notes: previousNotes ?? "",
      mockRole,
    });

    if (!result.ok) {
      setResources((prev) =>
        withSkillUpdated(prev, resource.id, showId, previousStatus, previousNotes)
      );
      setErrorMessage(`Could not update ${resource.name} for ${showName}: ${result.error}`);
    } else {
      setErrorMessage(null);
    }

    setSavingCells((prev) => {
      const next = { ...prev };
      delete next[cellKey];
      return next;
    });
  };

  const onSelectStatus = (
    resource: DashboardResource,
    showId: string,
    showName: string,
    nextStatus: SkillStatus
  ) => {
    if (!editable) {
      return;
    }

    const currentSkill = getCellSkill(resource, showId, "shows");
    setOpenStatusMenuKey(null);
    lastTriggerRef.current?.focus();

    if (currentSkill.status === nextStatus) {
      return;
    }

    setResources((prev) =>
      withSkillUpdated(prev, resource.id, showId, nextStatus, currentSkill.notes)
    );

    void saveStatusUpdate(
      resource,
      showId,
      showName,
      currentSkill.status,
      currentSkill.notes,
      nextStatus
    );
  };

  const saveNotes = async () => {
    if (!activeCell) {
      return;
    }

    setIsNotesSaving(true);

    const notesValue = activeCell.notes.trim();
    const result = await updateSkillAction({
      resourceId: activeCell.resourceId,
      showId: activeCell.showId,
      status: activeCell.status,
      notes: notesValue,
      mockRole,
    });

    if (!result.ok) {
      setErrorMessage(result.error);
      setIsNotesSaving(false);
      return;
    }

    setResources((prev) =>
      withSkillUpdated(
        prev,
        activeCell.resourceId,
        activeCell.showId,
        activeCell.status,
        notesValue || null
      )
    );

    setErrorMessage(null);
    setActiveCell(null);
    setIsNotesSaving(false);
  };

  const removeResource = async (resource: DashboardResource) => {
    if (!editable) {
      return;
    }

    setErrorMessage(null);
    setOpenStatusMenuKey(null);
    setOpenResourceMenuId(null);
    setResourceMenuPosition(null);
    setRemovingResourceIds((prev) => ({ ...prev, [resource.id]: true }));

    let removedIndex = -1;
    let removedResource: DashboardResource | null = null;

    setResources((prev) => {
      removedIndex = prev.findIndex((item) => item.id === resource.id);
      if (removedIndex === -1) {
        return prev;
      }

      removedResource = prev[removedIndex];
      return prev.filter((item) => item.id !== resource.id);
    });

    const result = await removeResourceAction({
      resourceId: resource.id,
      mockRole,
    });

    if (!result.ok) {
      if (removedResource) {
        setResources((prev) => {
          const resourceToRestore = removedResource;
          if (!resourceToRestore) {
            return prev;
          }

          if (prev.some((item) => item.id === resourceToRestore.id)) {
            return prev;
          }

          const next = [...prev];
          const insertAt = Math.max(0, Math.min(removedIndex, next.length));
          next.splice(insertAt, 0, resourceToRestore);
          return next;
        });
      }
      setErrorMessage(`Could not remove ${resource.name}: ${result.error}`);
    }

    setRemovingResourceIds((prev) => {
      const next = { ...prev };
      delete next[resource.id];
      return next;
    });
  };

  return (
    <div ref={boardRef} className="flex min-h-0 flex-1 flex-col gap-3">
      <MatrixFilterToolbar
        search={search}
        onSearchChange={setSearch}
        columnLabel="Filter by show"
        columnAllLabel="All Shows"
        columnValue={capabilityShowId}
        columns={data.shows.map((show) => ({ id: show.id, label: show.name }))}
        onColumnChange={setCapabilityShowId}
        capabilityStatuses={capabilityStatuses}
        onToggleCapabilityStatus={toggleCapabilityStatus}
        roles={roles}
        selectedRoles={selectedRoles}
        onToggleRole={toggleRoleFilter}
        filteredCount={filteredResources.length}
        premium={premium}
      />

      {!editable ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
          Matrix is in Read Only mode. Use the Access dropdown in the top bar and switch to Manager/Admin to edit statuses.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <section
        className={cn(
          "relative flex-1 overflow-auto rounded-xl border shadow-sm",
          premium
            ? "border-[color:var(--border-subtle)] bg-[color:var(--surface-1)]"
            : "border-slate-200 bg-white"
        )}
        onScroll={(event) => {
          setIsScrolled(event.currentTarget.scrollTop > 0);
          setOpenStatusMenuKey(null);
          setOpenResourceMenuId(null);
          setResourceMenuPosition(null);
        }}
      >
        <table className="min-w-full border-separate border-spacing-0 text-xs text-[color:var(--text-muted)]">
          <thead
            className={cn(
              "sticky top-0 z-20 transition-shadow",
              isScrolled
                ? "bg-[#0f1d30] shadow-[0_8px_16px_rgba(0,0,0,0.35)]"
                : "bg-[#14263c]"
            )}
          >
            <tr>
              <th className="sticky left-0 z-30 border-b-2 border-r-2 border-slate-950 bg-[#14263c] px-4 py-3 text-left font-extrabold uppercase tracking-[0.14em] text-white whitespace-nowrap">
                Crew Member
              </th>
              {filteredShows.map((show) => (
                <th
                  key={show.id}
                  className="status-cell border-b-2 border-r-2 border-slate-950 bg-[#14263c] px-2 py-3 text-left font-extrabold uppercase tracking-[0.11em] text-white whitespace-nowrap"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full ring-2 ring-white/30",
                        show.type === "Scripted" ? "bg-purple-400" : "bg-emerald-400"
                      )}
                    />
                    {show.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {groupedResources.map(([role, roleResources]) => {
            const isCollapsed = collapsedRoles.includes(role);

            return (
              <tbody key={role} className="bg-[color:var(--surface-1)]">
                <RoleGroupHeader
                  role={role}
                  count={roleResources.length}
                  isCollapsed={isCollapsed}
                  colSpan={filteredShows.length + 1}
                  onToggle={() => toggleRoleCollapse(role)}
                  onAddResource={editable ? () => setAddUserRole(role) : undefined}
                />

                {!isCollapsed &&
                  roleResources.map((resource, index) => (
                    <tr
                      key={resource.id}
                      className={cn("transition-colors", index % 2 === 1 ? "bg-[color:var(--surface-2)]" : "bg-[color:var(--surface-1)]")}
                    >
                      <td className="sticky left-0 z-10 overflow-visible border-b-2 border-r-2 border-slate-950 bg-inherit px-3 py-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-[13px] font-black tracking-tight text-[color:var(--text-strong)]">{resource.name}</div>
                            <div className="text-[9px] font-black uppercase tracking-[0.12em] text-[color:var(--text-muted)]">{resource.role}</div>
                          </div>
                          {editable ? (
                            <div className="flex items-start">
                              <button
                                type="button"
                                data-resource-menu-trigger="true"
                                onClick={(event) => {
                                  setOpenStatusMenuKey(null);
                                  const triggerRect = event.currentTarget.getBoundingClientRect();
                                  setOpenResourceMenuId((prev) => {
                                    if (prev === resource.id) {
                                      setResourceMenuPosition(null);
                                      return null;
                                    }

                                    const menuWidth = 88;
                                    const menuHeight = 62;
                                    const nextLeft = Math.max(
                                      8,
                                      Math.min(triggerRect.right - menuWidth, window.innerWidth - menuWidth - 8)
                                    );
                                    const nextTop = Math.max(
                                      8,
                                      Math.min(triggerRect.bottom + 4, window.innerHeight - menuHeight - 8)
                                    );

                                    setResourceMenuPosition({ top: nextTop, left: nextLeft });
                                    return resource.id;
                                  });
                                }}
                                className="rounded p-0.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
                                aria-label={`Open actions for ${resource.name}`}
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </td>

                      {filteredShows.map((show) => {
                        const skill = getCellSkill(resource, show.id, "shows");
                        const cellKey = `${resource.id}:${show.id}`;
                        const isSaving = Boolean(savingCells[cellKey]);
                        const hasNotes = Boolean(skill.notes?.trim());

                        return (
                          <StatusCell
                            key={`${resource.id}-${show.id}`}
                            cellKey={cellKey}
                            status={skill.status}
                            hasNotes={hasNotes}
                            statusAriaLabel={`${resource.name} ${show.name} ${skill.status}`}
                            noteAriaLabel={`Open note for ${resource.name} on ${show.name}`}
                            isSaving={isSaving}
                            editable={editable}
                            notesVisible={notesVisible}
                            isMenuOpen={openStatusMenuKey === cellKey}
                            onToggleMenu={(key, button) => {
                              lastTriggerRef.current = button;
                              setOpenStatusMenuKey((prev) => (prev === key ? null : key));
                            }}
                            onSelectStatus={(nextStatus) =>
                              onSelectStatus(resource, show.id, show.name, nextStatus)
                            }
                            onCloseMenu={() => {
                              setOpenStatusMenuKey(null);
                              lastTriggerRef.current?.focus();
                            }}
                            onOpenNote={() => {
                              setErrorMessage(null);
                              setOpenStatusMenuKey(null);
                              setActiveCell({
                                resourceId: resource.id,
                                showId: show.id,
                                resourceName: resource.name,
                                showName: show.name,
                                status: skill.status,
                                notes: skill.notes ?? "",
                              });
                            }}
                            resourceName={resource.name}
                            columnName={show.name}
                          />
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            );
          })}
        </table>
      </section>

      <CellEditorDialog
        open={Boolean(activeCell)}
        resourceName={activeCell?.resourceName ?? ""}
        showName={activeCell?.showName ?? ""}
        notes={activeCell?.notes ?? ""}
        editable={editable}
        pending={isNotesSaving}
        errorMessage={errorMessage}
        onNotesChange={(notes) => setActiveCell((prev) => (prev ? { ...prev, notes } : prev))}
        onSave={saveNotes}
        onClose={() => {
          setErrorMessage(null);
          setActiveCell(null);
        }}
      />

      {addUserRole ? (
        <AddUserDialog
          defaultRole={addUserRole}
          roles={roles}
          onAdded={(resource) => {
            setResources((prev) => [
              ...prev,
              {
                ...resource,
                skills: {},
                controlRoomSkills: {},
              },
            ]);
          }}
          onClose={() => setAddUserRole(null)}
        />
      ) : null}

      {editResource ? (
        <EditUserDialog
          resourceId={editResource.id}
          initialName={editResource.name}
          initialRole={editResource.role}
          initialPhone={editResource.phone}
          roles={roles}
          onUpdated={(updatedResource) => {
            setResources((prev) =>
              prev.map((resource) =>
                resource.id === updatedResource.id
                  ? {
                      ...resource,
                      name: updatedResource.name,
                      role: updatedResource.role,
                      phone: updatedResource.phone,
                    }
                  : resource
              )
            );
          }}
          onClose={() => setEditResource(null)}
        />
      ) : null}

      {openResourceMenuId && resourceMenuPosition ? (
        <div
          role="menu"
          data-resource-menu="true"
          aria-label={`Resource actions`}
          className="fixed z-[70] min-w-[88px] rounded border border-slate-200 bg-white p-0.5 shadow-md"
          style={{ top: resourceMenuPosition.top, left: resourceMenuPosition.left }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              const resource = resources.find((item) => item.id === openResourceMenuId);
              setOpenResourceMenuId(null);
              setResourceMenuPosition(null);
              if (!resource) {
                return;
              }
              setEditResource({
                id: resource.id,
                name: resource.name,
                role: resource.role,
                phone: resource.phone,
              });
            }}
            className="w-full rounded px-1.5 py-0.5 text-left text-[9px] font-semibold text-slate-700 hover:bg-slate-100"
            aria-label="Edit selected resource"
          >
            Edit
          </button>
          <div className="my-0.5 h-px bg-slate-200" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              const resource = resources.find((item) => item.id === openResourceMenuId);
              setOpenResourceMenuId(null);
              setResourceMenuPosition(null);
              if (!resource) {
                return;
              }
              void removeResource(resource);
            }}
            disabled={Boolean(openResourceMenuId && removingResourceIds[openResourceMenuId])}
            className="w-full rounded px-1.5 py-0.5 text-left text-[9px] font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Delete selected resource"
          >
            {openResourceMenuId && removingResourceIds[openResourceMenuId] ? "Deleting..." : "Delete"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
