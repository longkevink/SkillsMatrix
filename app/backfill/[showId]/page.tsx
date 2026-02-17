import { BackfillBoard } from "@/src/components/backfill-board";
import { SetupState } from "@/src/components/setup-state";
import { getBackfillPageData } from "@/src/lib/data/backfill";

export const dynamic = "force-dynamic";

interface BackfillShowPageProps {
  params: Promise<{ showId: string }>;
}

export default async function BackfillShowPage({ params }: BackfillShowPageProps) {
  const { showId } = await params;
  let data:
    | Awaited<ReturnType<typeof getBackfillPageData>>
    | null = null;
  let message: string | null = null;

  try {
    data = await getBackfillPageData(showId);
  } catch (error) {
    message = error instanceof Error ? error.message : "Unknown error";
  }

  if (message || !data) {
    return (
      <SetupState
        title="Backfill Data Unavailable"
        message="Configure Supabase and seed data before using backfill rankings."
        details={message ?? "No backfill data found."}
      />
    );
  }

  return <BackfillBoard data={data} />;
}
