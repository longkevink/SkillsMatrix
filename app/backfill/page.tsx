import { redirect } from "next/navigation";
import { SetupState } from "@/src/components/setup-state";
import { getBackfillPageData } from "@/src/lib/data/backfill";

export const dynamic = "force-dynamic";

export default async function BackfillIndexPage() {
  let data;

  try {
    data = await getBackfillPageData();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return (
      <SetupState
        title="Backfill Data Unavailable"
        message="Configure Supabase and seed data before using backfill rankings."
        details={message}
      />
    );
  }

  if (data) {
    redirect(`/backfill/${data.selectedShow.id}`);
  }
}
