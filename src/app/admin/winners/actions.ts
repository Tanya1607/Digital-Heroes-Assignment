"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

const approveSchema = z.object({ id: z.string().uuid() });
const rejectSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(1).max(300),
});
const paidSchema = z.object({ id: z.string().uuid() });

export async function approveWinnerAction(formData: FormData) {
  const { id } = approveSchema.parse({ id: formData.get("id") });
  const supabase = await createClient();
  await supabase
    .from("winners")
    .update({ verification: "approved", rejection_reason: null })
    .eq("id", id);
  revalidatePath("/admin/winners");
}

export async function rejectWinnerAction(formData: FormData) {
  const parsed = rejectSchema.parse({
    id: formData.get("id"),
    reason: formData.get("reason"),
  });
  const supabase = await createClient();
  await supabase
    .from("winners")
    .update({ verification: "rejected", rejection_reason: parsed.reason })
    .eq("id", parsed.id);
  revalidatePath("/admin/winners");
}

export async function markPaidAction(formData: FormData) {
  const { id } = paidSchema.parse({ id: formData.get("id") });
  const supabase = await createClient();
  await supabase
    .from("winners")
    .update({ payout_status: "paid", paid_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/winners");
}

export async function signedProofUrl(path: string) {
  const { data } = await adminClient()
    .storage.from("winner-proofs")
    .createSignedUrl(path, 60 * 10);
  return data?.signedUrl ?? null;
}
