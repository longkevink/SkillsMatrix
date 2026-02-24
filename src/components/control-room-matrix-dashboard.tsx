"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { updateControlRoomSkillAction } from "@/src/lib/actions/control-rooms";
import { CellEditorDialog } from "@/src/components/cell-editor-dialog";
import { SKILL_STATUSES } from "@/src/lib/constants";
import { canEdit, canViewNotes } from "@/src/lib/mock-role";
import { useMockRole } from "@/src/components/mock-role-provider";
import { DensityToolbar } from "@/src/components/premium/density-toolbar";
import { InlineStatusDot } from "@/src/components/premium/inline-status-dot";
import { uiFeatureFlags } from "@/src/lib/ui/feature-flags";
import { groupByRole, getCellSkill } from "@/src/lib/matrix-utils";
import { MatrixFilterToolbar } from "@/src/components/matrix/matrix-filter-toolbar";
import { StatusCell } from "@/src/components/matrix/status-cell";
import { RoleGroupHeader } from "@/src/components/matrix/role-group-header";
import { cn } from "@/src/lib/utils";
import type { MatrixPageData, DashboardResource, SkillStatus } from "@/src/lib/types";

interface ControlRoomMatrixDashboardProps {
  data: MatrixPageData;
}

interface ActiveCell {
  resourceId: string;
  controlRoomId: string;
  resourceName: string;
  controlRoomCode: string;
  status: SkillStatus;
  notes: string;
}

export function ControlRoomMatrixDashboard({ data }: ControlRoomMatrixDashboardProps) {
  const { mockRole } = useMockRole();
  const editable = canEdit(mockRole);
  const notesVisible = canViewNotes(mockRole);
  const premium = uiFeatureFlags.premiumOperationsEnabled;

  const [resources, setResources] = useState(data.resources);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [search, setSearch] = useState("");
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

  const roles = useMemo(
    () => [...new Set(resources.map((resource) => resource.role))].sort(),
    [resources]
  );

  const filteredResources = useMemo(() => {
    const roleSet = new Set(selectedRoles);
    const statusSet = new Set(capabilityStatuses);
    const normalizedSearch = search.trim().toLowerCase();

    return resources.filter((resource) => {
      if (roleSet.size > 0 && !roleSet.has(resource.role)) {
        return false;
      }

      if (normalizedSearch && !resource.name.toLowerCase().includes(normalizedSearch)) {
        return false;
      }

      if (statusSet.size > 0) {
        const hasMatchingStatus = data.controlRooms.some((room) => {
          const skill = getCellSkill(resource, room.id, "controlRooms");
          return statusSet.has(skill.status);
        });

        if (!hasMatchingStatus) {
          return false;
        }
      }

      return true;
    });
  }, [resources, selectedRoles, search, capabilityStatuses, data.controlRooms]);

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
    controlRoomId: string,
    status: SkillStatus,
    notes: string | null
  ) => {
    return list.map((resource) => {
      if (resource.id !== resourceId) {
        return resource;
      }

      return {
        ...resource,
        controlRoomSkills: {
          ...resource.controlRoomSkills,
          [controlRoomId]: {
            status,
            notes,
          },
        },
      };
    });
  };

  const saveStatusUpdate = async (
    resource: DashboardResource,
    controlRoomId: string,
    controlRoomCode: string,
    previousStatus: SkillStatus,
    previousNotes: string | null,
    nextStatus: SkillStatus
  ) => {
    const cellKey = `${resource.id}:${controlRoomId}`;
    setSavingCells((prev) => ({ ...prev, [cellKey]: true }));

    const result = await updateControlRoomSkillAction({
      resourceId: resource.id,
      controlRoomId,
      status: nextStatus,
      notes: previousNotes ?? "",
      mockRole,
    });

    if (!result.ok) {
      setResources((prev) =>
        withSkillUpdated(prev, resource.id, controlRoomId, previousStatus, previousNotes)
      );
      setErrorMessage(`Could not update ${resource.name} for ${controlRoomCode}: ${result.error}`);
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
    controlRoomId: string,
    controlRoomCode: string,
    nextStatus: SkillStatus
  ) => {
    if (!editable) {
      return;
    }

    const currentSkill = getCellSkill(resource, controlRoomId, "controlRooms");
    setOpenStatusMenuKey(null);
    lastTriggerRef.current?.focus();

    if (currentSkill.status === nextStatus) {
      return;
    }

    setResources((prev) =>
      withSkillUpdated(prev, resource.id, controlRoomId, nextStatus, currentSkill.notes)
    );

    void saveStatusUpdate(
      resource,
      controlRoomId,
      controlRoomCode,
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
    const result = await updateControlRoomSkillAction({
      resourceId: activeCell.resourceId,
      controlRoomId: activeCell.controlRoomId,
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
      withSkillUpdated(prev, activeCell.resourceId, activeCell.controlRoomId, activeCell.status, notesValue || null)
    );

    setErrorMessage(null);
    setActiveCell(null);
    setIsNotesSaving(false);
  };

  if (!data.controlRooms.length) {
    return (
      <section className="rounded border border-amber-300 bg-amber-50 p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-amber-900">No Control Rooms Found</h2>
        <p className="mt-1 text-sm text-amber-800">
          The Control Rooms feature is not ready in your Supabase project yet. This usually means the migration has not
          been applied, or Supabase API schema cache has not reloaded.
        </p>
        {data.controlRoomsLoadError ? (
          <pre className="mt-3 overflow-auto rounded border border-amber-200 bg-white p-2 font-mono text-xs text-amber-900">
            {data.controlRoomsLoadError}
          </pre>
        ) : null}
        <pre className="mt-3 overflow-auto rounded border border-amber-200 bg-white p-2 font-mono text-xs text-amber-900">
          1) Apply migration: supabase/migrations/20260210120000_add_control_rooms.sql{"\n"}
          2) Reload API schema cache (Supabase Dashboard -&gt; Settings -&gt; API -&gt; Reload schema){"\n"}
          3) Optional: run seed to create skills rows: npm run seed:db
        </pre>
      </section>
    );
  }

  return (
    <div ref={boardRef} className="flex min-h-0 flex-1 flex-col gap-3">
      {premium ? (
        <DensityToolbar
          title="Control Room Skill"
          detail={`${filteredResources.length} crew mapped against ${data.controlRooms.length} control rooms.`}
        >
          <InlineStatusDot tone="success" label="Active" />
          <InlineStatusDot tone="warning" label="Refresh" />
          <InlineStatusDot tone="accent" label="Training" />
          <InlineStatusDot tone="danger" label="Red" />
        </DensityToolbar>
      ) : (
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--text-muted)]">
          Control Room Skill
        </p>
      )}

      <MatrixFilterToolbar
        search={search}
        onSearchChange={setSearch}
        columnLabel="Control Room"
        columnAllLabel="All Control Rooms"
        columnValue=""
        columns={data.controlRooms.map((room) => ({ id: room.id, label: room.code }))}
        onColumnChange={() => undefined}
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
              <th className="sticky left-0 z-30 border-b-2 border-r-2 border-slate-950 bg-[#14263c] px-3 py-2 text-left font-extrabold uppercase tracking-[0.14em] text-white min-w-[200px]">
                Crew Member
              </th>
              {data.controlRooms.map((room) => (
                <th
                  key={room.id}
                  className="status-cell border-b-2 border-r-2 border-slate-950 bg-[#14263c] px-2 py-3 text-center font-extrabold uppercase tracking-[0.11em] text-white min-w-[100px]"
                >
                  {room.code}
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
                  colSpan={data.controlRooms.length + 1}
                  onToggle={() => toggleRoleCollapse(role)}
                />

                {!isCollapsed &&
                  roleResources.map((resource, index) => {
                    return (
                      <tr
                        key={resource.id}
                        className={cn("transition-colors", index % 2 === 1 ? "bg-[color:var(--surface-2)]" : "bg-[color:var(--surface-1)]")}
                      >
                        <td className="sticky left-0 z-10 border-b-2 border-r-2 border-slate-950 bg-inherit px-3 py-2">
                          <div className="text-[13px] font-black tracking-tight text-[color:var(--text-strong)]">{resource.name}</div>
                          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-[color:var(--text-muted)]">{resource.role}</div>
                        </td>

                        {data.controlRooms.map((room) => {
                          const skill = getCellSkill(resource, room.id, "controlRooms");
                          const cellKey = `${resource.id}:${room.id}`;
                          const isSaving = Boolean(savingCells[cellKey]);
                          const hasNotes = Boolean(skill.notes?.trim());

                          return (
                            <StatusCell
                              key={room.id}
                              cellKey={cellKey}
                              status={skill.status}
                              hasNotes={hasNotes}
                              statusAriaLabel={`${resource.name} ${room.code} ${skill.status}`}
                              noteAriaLabel={`Open note for ${resource.name} on ${room.code}`}
                              isSaving={isSaving}
                              editable={editable}
                              notesVisible={notesVisible}
                              isMenuOpen={openStatusMenuKey === cellKey}
                              onToggleMenu={(key, button) => {
                                lastTriggerRef.current = button;
                                setOpenStatusMenuKey((prev) => (prev === key ? null : key));
                              }}
                              onSelectStatus={(nextStatus) =>
                                onSelectStatus(resource, room.id, room.code, nextStatus)
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
                                  controlRoomId: room.id,
                                  resourceName: resource.name,
                                  controlRoomCode: room.code,
                                  status: skill.status,
                                  notes: skill.notes ?? "",
                                });
                              }}
                              resourceName={resource.name}
                              columnName={room.code}
                            />
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            );
          })}
        </table>
      </section>

      <CellEditorDialog
        open={Boolean(activeCell)}
        resourceName={activeCell?.resourceName ?? ""}
        showName={activeCell?.controlRoomCode ?? ""}
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
