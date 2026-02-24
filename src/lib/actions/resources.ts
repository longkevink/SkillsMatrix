"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { canEdit } from "@/src/lib/mock-role";
import { getSupabaseAdminClient } from "@/src/lib/supabase/admin";

const addResourceSchema = z.object({
    name: z.string().min(1, "Name is required"),
    role: z.string().min(1, "Role is required"),
    phone: z.string().optional(),
    mockRole: z.enum(["Read Only", "Manager", "Admin"]),
});

const removeResourceSchema = z.object({
    resourceId: z.string().uuid(),
    mockRole: z.enum(["Read Only", "Manager", "Admin"]),
});

const updateResourceSchema = z.object({
    resourceId: z.string().uuid(),
    name: z.string().min(1, "Name is required"),
    role: z.string().min(1, "Role is required"),
    phone: z.string().optional(),
    mockRole: z.enum(["Read Only", "Manager", "Admin"]),
});

export async function addResourceAction(input: unknown) {
    const parsed = addResourceSchema.safeParse(input);

    if (!parsed.success) {
        return { ok: false, error: "Invalid payload." } as const;
    }

    if (!canEdit(parsed.data.mockRole)) {
        return { ok: false, error: "Read Only mode cannot add resources." } as const;
    }

    const supabase = getSupabaseAdminClient();

    const name = parsed.data.name.trim();
    const role = parsed.data.role.trim();
    const phone = parsed.data.phone?.trim() || null;

    const { data, error } = await supabase
        .from("resources")
        .insert({
            name,
            role,
            phone,
        })
        .select("id,name,role,phone")
        .single();

    if (error) {
        // If it's a unique constraint violation, provide a nicer error message
        if (error.code === "23505") { // unique_violation
            return { ok: false, error: "A resource with this name and role already exists." } as const;
        }
        return { ok: false, error: error.message } as const;
    }

    // Revalidate pages to show the new resource
    revalidatePath("/");
    revalidatePath("/matrix");
    revalidatePath("/skills");
    revalidatePath("/backfill");

    return {
        ok: true,
        resource: {
            id: data.id,
            name: data.name,
            role: data.role,
            phone: data.phone ?? undefined,
        },
    } as const;
}

export async function removeResourceAction(input: unknown) {
    const parsed = removeResourceSchema.safeParse(input);

    if (!parsed.success) {
        return { ok: false, error: "Invalid payload." } as const;
    }

    if (!canEdit(parsed.data.mockRole)) {
        return { ok: false, error: "Read Only mode cannot remove resources." } as const;
    }

    const supabase = getSupabaseAdminClient();

    const { error } = await supabase
        .from("resources")
        .delete()
        .eq("id", parsed.data.resourceId);

    if (error) {
        return { ok: false, error: error.message } as const;
    }

    revalidatePath("/");
    revalidatePath("/matrix");
    revalidatePath("/skills");
    revalidatePath("/backfill");

    return { ok: true } as const;
}

export async function updateResourceAction(input: unknown) {
    const parsed = updateResourceSchema.safeParse(input);

    if (!parsed.success) {
        return { ok: false, error: "Invalid payload." } as const;
    }

    if (!canEdit(parsed.data.mockRole)) {
        return { ok: false, error: "Read Only mode cannot edit resources." } as const;
    }

    const supabase = getSupabaseAdminClient();
    const name = parsed.data.name.trim();
    const role = parsed.data.role.trim();
    const phone = parsed.data.phone?.trim() || null;

    const { error } = await supabase
        .from("resources")
        .update({ name, role, phone })
        .eq("id", parsed.data.resourceId);

    if (error) {
        if (error.code === "23505") {
            return { ok: false, error: "A resource with this name and role already exists." } as const;
        }
        return { ok: false, error: error.message } as const;
    }

    revalidatePath("/");
    revalidatePath("/matrix");
    revalidatePath("/skills");
    revalidatePath("/backfill");

    return { ok: true } as const;
}
