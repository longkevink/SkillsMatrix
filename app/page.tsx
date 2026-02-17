import { ChatInterface } from "@/src/components/dashboard/chat-interface";
import { SkillsWidget } from "@/src/components/dashboard/skills-widget";
import { BackfillWidget } from "@/src/components/dashboard/backfill-widget";
import { getDashboardData } from "@/src/lib/data/dashboard";
import { getBackfillPageData } from "@/src/lib/data/backfill";
import { buildExecutiveSnapshot } from "@/src/lib/data/executive";
import { uiFeatureFlags } from "@/src/lib/ui/feature-flags";

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

  if (!uiFeatureFlags.premiumDashboardEnabled) {
    return (
      <div className="flex flex-col gap-8 pb-8">
        <section className="relative ml-[calc(50%-50dvw)] flex min-h-[300px] w-[100dvw] max-w-none items-center justify-center overflow-hidden border border-[color:var(--border-subtle)] bg-[color:var(--surface-2)] px-4 md:px-8">
          <div className="relative z-10 mx-auto w-full md:w-[75%]">
            <ChatInterface snapshot={snapshot} />
          </div>
        </section>
        <section className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-full min-h-[400px]">
            <SkillsWidget data={dashboardData} />
          </div>
          <div className="h-full min-h-[400px]">
            <BackfillWidget data={backfillData} />
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <section className="relative ml-[calc(50%-50dvw)] flex min-h-[280px] w-[100dvw] max-w-none items-center justify-center overflow-hidden border border-[color:var(--border-subtle)] bg-[linear-gradient(165deg,var(--surface-1),var(--surface-2))] px-4 py-4 shadow-[0_20px_40px_-30px_rgba(15,23,42,0.55)]">
        <div className="mx-auto w-full md:w-[75%]">
          <ChatInterface snapshot={snapshot} />
        </div>
      </section>

      <section className="grid flex-1 grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <div className="h-full min-h-[400px]">
            <SkillsWidget data={dashboardData} />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-full min-h-[400px]">
            <BackfillWidget data={backfillData} />
          </div>
        </div>
      </section>
    </div>
  );
}
