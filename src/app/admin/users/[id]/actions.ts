"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const editScoreSchema = z.object({
  id: z.string().uuid(),
  value: z.coerce.number().int().min(1).max(45),
});

const deleteScoreSchema = z.object({ id: z.string().uuid() });

const roleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["user", "admin"]),
});

export async function adminEditScoreAction(formData: FormData) {
  const parsed = editScoreSchema.parse({
    id: formData.get("id"),
    value: formData.get("value"),
  });
  const supabase = await createClient();
  await supabase
    .from("scores")
    .update({ value: parsed.value })
    .eq("id", parsed.id);
  revalidatePath(`/admin/users`);
}

export async function adminDeleteScoreAction(formData: FormData) {
  const { id } = deleteScoreSchema.parse({ id: formData.get("id") });
  const supabase = await createClient();
  await supabase.from("scores").delete().eq("id", id);
  revalidatePath(`/admin/users`);
}

export async function adminSetRoleAction(formData: FormData) {
  const parsed = roleSchema.parse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ role: parsed.role })
    .eq("id", parsed.userId);
  revalidatePath(`/admin/users`);
}
