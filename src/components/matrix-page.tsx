"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MatrixDashboard } from "@/src/components/matrix-dashboard";
import { ControlRoomMatrixDashboard } from "@/src/components/control-room-matrix-dashboard";
import type { MatrixPageData } from "@/src/lib/types";
import { cn } from "@/src/lib/utils";
import { uiFeatureFlags } from "@/src/lib/ui/feature-flags";

type MatrixTab = "shows" | "control-rooms";

const TAB_ORDER: MatrixTab[] = ["control-rooms", "shows"];

interface MatrixPageProps {
  data: MatrixPageData;
}

export function MatrixPage({ data }: MatrixPageProps) {
  const [activeTab, setActiveTab] = useState<MatrixTab>("shows");
  const tabsRef = useRef<HTMLDivElement>(null);

  const tabs = useMemo(
    () => [
      { id: "control-rooms" as const, label: "Skills" },
      { id: "shows" as const, label: "Shows" },
    ],
    []
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!tabsRef.current || !tabsRef.current.contains(document.activeElement)) {
        return;
      }

      const currentIndex = TAB_ORDER.indexOf(activeTab);
      if (currentIndex === -1) {
        return;
      }

      const moveTo = (index: number) => {
        const next = TAB_ORDER[(index + TAB_ORDER.length) % TAB_ORDER.length];
        setActiveTab(next);
        const nextButton = tabsRef.current?.querySelector<HTMLButtonElement>(
          `button[data-tab='${next}']`
        );
        nextButton?.focus();
      };

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          moveTo(currentIndex - 1);
          break;
        case "ArrowRight":
          event.preventDefault();
          moveTo(currentIndex + 1);
          break;
        case "Home":
          event.preventDefault();
          moveTo(0);
          break;
        case "End":
          event.preventDefault();
          moveTo(TAB_ORDER.length - 1);
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeTab]);

  return (
    <div className="flex h-[calc(100vh-4.6rem)] flex-col gap-3">
      <section className={cn(
        "rounded-xl border bg-white p-1.5 shadow-sm",
        uiFeatureFlags.premiumOperationsEnabled
          ? "border-[color:var(--border-subtle)] bg-[color:var(--surface-1)]"
          : "border-slate-200"
      )}>
        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Matrix views"
          className={cn(
            "flex flex-wrap gap-1 rounded-lg p-1",
            uiFeatureFlags.premiumOperationsEnabled
              ? "border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)]"
              : "bg-slate-100"
          )}
        >
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                data-tab={tab.id}
                aria-selected={selected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                  selected
                    ? "bg-[color:var(--surface-1)] text-[color:var(--text-strong)] shadow-sm"
                    : "text-[color:var(--text-muted)] hover:text-[color:var(--text-strong)]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      <div
        id="panel-control-rooms"
        role="tabpanel"
        aria-label="Skills"
        aria-hidden={activeTab !== "control-rooms"}
        className={cn("min-h-0 flex-1", activeTab === "control-rooms" ? "flex flex-col" : "hidden")}
      >
        <ControlRoomMatrixDashboard data={data} />
      </div>

      <div
        id="panel-shows"
        role="tabpanel"
        aria-label="Shows"
        aria-hidden={activeTab !== "shows"}
        className={cn("min-h-0 flex-1", activeTab === "shows" ? "flex flex-col" : "hidden")}
      >
        <MatrixDashboard data={{ shows: data.shows, resources: data.resources }} />
      </div>
    </div>
  );
}
