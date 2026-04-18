"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

const updateSchema = z.object({
  charityId: z.string().uuid(),
  charityPct: z.coerce.number().min(10).max(100),
});

export async function updateCharityAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
) {
  const parsed = updateSchema.safeParse({
    charityId: formData.get("charityId"),
    charityPct: formData.get("charityPct"),
  });
  if (!parsed.success)
    return { error: "Choose a charity and a percentage of at least 10%." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  const { error } = await supabase
    .from("profiles")
    .update({
      charity_id: parsed.data.charityId,
      charity_pct: parsed.data.charityPct,
    })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/charity");
  revalidatePath("/dashboard");
  return { ok: true };
}

const donateSchema = z.object({
  charityId: z.string().uuid(),
  amountMinor: z.coerce.number().int().min(100),
});

export async function independentDonationAction(
  _prev: { error?: string; ok?: boolean } | null,
  formData: FormData,
) {
  const parsed = donateSchema.safeParse({
    charityId: formData.get("charityId"),
    amountMinor: formData.get("amountMinor"),
  });
  if (!parsed.success) return { error: "Enter at least £1 and choose a charity." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sign in first." };

  // Record a 'planned' independent donation row. In a production build this
  // would go via a Stripe one-off checkout; for the demo we log intent.
  const admin = adminClient();
  const { error } = await admin.from("donations").insert({
    user_id: user.id,
    charity_id: parsed.data.charityId,
    amount_minor: parsed.data.amountMinor,
    currency: "GBP",
    source: "independent",
    period_month: null,
  });
  if (error) return { error: error.message };

  revalidatePath("/charity");
  return { ok: true };
}
