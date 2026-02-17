import { MatrixPage } from "@/src/components/matrix-page";
import { SetupState } from "@/src/components/setup-state";
import { getMatrixPageData } from "@/src/lib/data/matrix";

export const dynamic = "force-dynamic";

export default async function MatrixPageRoute() {
  let data: Awaited<ReturnType<typeof getMatrixPageData>> | null = null;
  let message: string | null = null;

  try {
    data = await getMatrixPageData();
  } catch (error) {
    message = error instanceof Error ? error.message : "Unknown error";
  }

  if (message) {
    return (
      <SetupState
        title="Supabase Setup Required"
        message="Configure environment variables and run migrations + seed before using the dashboard."
        details={message}
      />
    );
  }

  if (!data || !data.shows.length || !data.resources.length) {
    return (
      <SetupState
        title="No Data Found"
        message="Run the Supabase migration + seed script to populate the matrix."
        details="npm run seed:db"
      />
    );
  }

  return <MatrixPage data={data} />;
}
