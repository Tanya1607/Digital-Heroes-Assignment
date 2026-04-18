"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const scoreSchema = z.object({
  value: z.coerce.number().int().min(1).max(45),
  playedOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const editSchema = z.object({
  id: z.string().uuid(),
  value: z.coerce.number().int().min(1).max(45),
});

const deleteSchema = z.object({ id: z.string().uuid() });

export async function addScoreAction(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const parsed = scoreSchema.safeParse({
    value: formData.get("value"),
    playedOn: formData.get("playedOn"),
  });
  if (!parsed.success) return { error: "Score must be 1–45 with a valid date." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const { error } = await supabase.from("scores").insert({
    user_id: user.id,
    value: parsed.data.value,
    played_on: parsed.data.playedOn,
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "You already have a score for that date. Edit it instead." };
    }
    return { error: error.message };
  }

  revalidatePath("/scores");
  revalidatePath("/dashboard");
  return { ok: true } as { ok: true; error?: undefined };
}

export async function editScoreAction(formData: FormData) {
  const parsed = editSchema.safeParse({
    id: formData.get("id"),
    value: formData.get("value"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("scores")
    .update({ value: parsed.data.value })
    .eq("id", parsed.data.id);
  revalidatePath("/scores");
}

export async function deleteScoreAction(formData: FormData) {
  const parsed = deleteSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("scores").delete().eq("id", parsed.data.id);
  revalidatePath("/scores");
}
