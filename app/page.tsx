import { ChatInterface } from "@/src/components/dashboard/chat-interface";
import { KpiStrip } from "@/src/components/dashboard/kpi-strip";
import { TrainingPipelineWidget } from "@/src/components/dashboard/training-pipeline-widget";
import { ShowHeatmap } from "@/src/components/dashboard/show-heatmap";
import { RoleRiskTable } from "@/src/components/dashboard/role-risk-table";
import { BackfillWidget } from "@/src/components/dashboard/backfill-widget";
import { getDashboardData } from "@/src/lib/data/dashboard";
import { getBackfillPageData } from "@/src/lib/data/backfill";
import { buildExecutiveSnapshot } from "@/src/lib/data/executive";
import { buildDashboardAnalytics } from "@/src/lib/data/dashboard-analytics";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [dashboardDataResult, backfillDataResult] = await Promise.allSettled([
    getDashboardData(),
    getBackfillPageData(),
  ]);

  const dashboardData =
    dashboardDataResult.status === "fulfilled" ? dashboardDataResult.value : null;
  const backfillData =
    backfillDataResult.status === "fulfilled" ? backfillDataResult.value : null;

  if (dashboardDataResult.status === "rejected") {
    console.error("Dashboard data fetch failed:", dashboardDataResult.reason);
  }
  if (backfillDataResult.status === "rejected") {
    console.error("Backfill data fetch failed:", backfillDataResult.reason);
  }

  const snapshot = buildExecutiveSnapshot(dashboardData, backfillData);
  const analytics = buildDashboardAnalytics(dashboardData, backfillData);

  if (!analytics) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[color:var(--text-strong)]">Loading Dashboard</p>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">Unable to fetch data. Please refresh.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      {/* ── Row 1: KPI Strip ── */}
      <KpiStrip analytics={analytics} />

      {/* ── Row 2: AI Assistant Bar ── */}
      <ChatInterface snapshot={snapshot} />

      {/* ── Row 3: Training Pipeline | Heatmap ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Left col: Training Pipeline */}
        <div className="xl:col-span-5">
          <TrainingPipelineWidget analytics={analytics} />
        </div>

        {/* Right col: Heatmap */}
        <div className="xl:col-span-7">
          <div className="h-full rounded-xl border border-[color:var(--border-subtle)] bg-[linear-gradient(165deg,var(--surface-1),var(--surface-2))] p-4 shadow-[0_14px_28px_-20px_rgba(15,23,42,0.5)]">
            <ShowHeatmap analytics={analytics} />
          </div>
        </div>
      </div>

      {/* ── Row 4: Risk Table | Backfill Intel ── */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Left col: Role Risk Table */}
        <div className="xl:col-span-7">
          <div className="h-full rounded-xl border border-[color:var(--border-subtle)] bg-[linear-gradient(165deg,var(--surface-1),var(--surface-2))] p-4 shadow-[0_14px_28px_-20px_rgba(15,23,42,0.5)]">
            <RoleRiskTable analytics={analytics} />
          </div>
        </div>

        {/* Right col: Backfill Intel */}
        <div className="xl:col-span-5">
          <BackfillWidget data={backfillData} />
        </div>
      </div>
    </div>
  );
}
