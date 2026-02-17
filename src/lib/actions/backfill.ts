"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canEdit } from "@/src/lib/mock-role";
import { normalizeRankedIds } from "@/src/lib/backfill-utils";
import { getSupabaseAdminClient } from "@/src/lib/supabase/admin";

const reorderBackfillSchema = z.object({
  showId: z.string().uuid(),
  role: z.string().min(1).max(120),
  permanentResourceIds: z.array(z.string().uuid()),
  backupResourceIds: z.array(z.string().uuid()),
  mockRole: z.enum(["Read Only", "Manager", "Admin"]),
});

export async function reorderBackfillAction(input: unknown) {
  const parsed = reorderBackfillSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Invalid payload." } as const;
  }

  if (!canEdit(parsed.data.mockRole)) {
    return { ok: false, error: "Read Only mode cannot edit backfill rankings." } as const;
  }

  const permanent = normalizeRankedIds(parsed.data.permanentResourceIds);
  const backup = normalizeRankedIds(parsed.data.backupResourceIds.filter((id) => !permanent.includes(id)));

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.rpc("replace_backfill_preferences", {
    input_show_id: parsed.data.showId,
    input_role: parsed.data.role,
    permanent_ids: permanent,
    backup_ids: backup,
  });

  if (error) {
    return { ok: false, error: error.message } as const;
  }

  revalidatePath("/");
  revalidatePath(`/backfill/${parsed.data.showId}`);

  return { ok: true } as const;
}
