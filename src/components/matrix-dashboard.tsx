"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { updateSkillAction } from "@/src/lib/actions/skills";
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
  const [isNotesSaving, setIsNotesSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!boardRef.current) {
        return;
      }

      if (!boardRef.current.contains(event.target as Node)) {
        setOpenStatusMenuKey(null);
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
              <th className="sticky left-0 z-30 border-b-2 border-r-2 border-slate-950 bg-[#14263c] px-4 py-3 text-left font-extrabold uppercase tracking-[0.14em] text-white">
                Crew Member
              </th>
              {filteredShows.map((show) => (
                <th
                  key={show.id}
                  className="status-cell border-b-2 border-r-2 border-slate-950 bg-[#14263c] px-2 py-3 text-left font-extrabold uppercase tracking-[0.11em] text-white"
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

          <tbody className="bg-[color:var(--surface-1)]">
            {groupedResources.map(([role, roleResources]) => {
              const isCollapsed = collapsedRoles.includes(role);

              return (
                <Fragment key={role}>
                  <RoleGroupHeader
                    role={role}
                    count={roleResources.length}
                    isCollapsed={isCollapsed}
                    colSpan={filteredShows.length + 1}
                    onToggle={() => toggleRoleCollapse(role)}
                  />

                  {!isCollapsed &&
                    roleResources.map((resource, index) => (
                      <tr
                        key={resource.id}
                        className={cn("transition-colors", index % 2 === 1 ? "bg-[color:var(--surface-2)]" : "bg-[color:var(--surface-1)]")}
                      >
                        <td className="sticky left-0 z-10 border-b-2 border-r-2 border-slate-950 bg-inherit px-3 py-2">
                          <div className="text-[13px] font-black tracking-tight text-[color:var(--text-strong)]">{resource.name}</div>
                          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-[color:var(--text-muted)]">{resource.role}</div>
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
                </Fragment>
              );
            })}
          </tbody>
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
    </div>
  );
}
