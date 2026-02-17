"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canEdit } from "@/src/lib/mock-role";
import { getSupabaseAdminClient } from "@/src/lib/supabase/admin";
import { SKILL_STATUSES } from "@/src/lib/constants";

const updateSkillSchema = z.object({
  resourceId: z.string().uuid(),
  showId: z.string().uuid(),
  status: z.enum(SKILL_STATUSES),
  notes: z.string().max(4000),
  mockRole: z.enum(["Read Only", "Manager", "Admin"]),
});

export async function updateSkillAction(input: unknown) {
  const parsed = updateSkillSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Invalid payload." } as const;
  }

  if (!canEdit(parsed.data.mockRole)) {
    return { ok: false, error: "Read Only mode cannot edit skills." } as const;
  }

  const supabase = getSupabaseAdminClient();

  const { error } = await supabase.from("resource_skills").upsert(
    {
      resource_id: parsed.data.resourceId,
      show_id: parsed.data.showId,
      status: parsed.data.status,
      notes: parsed.data.notes.trim() || null,
    },
    { onConflict: "resource_id,show_id" }
  );

  if (error) {
    return { ok: false, error: error.message } as const;
  }

  revalidatePath("/");
  revalidatePath("/matrix");
  revalidatePath("/skills");

  return { ok: true } as const;
}
