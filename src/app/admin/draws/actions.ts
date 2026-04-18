"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendDrawResults, sendWinnerAlert } from "@/lib/mailers";

function firstOfMonth(d: Date = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export async function createDrawAction(formData: FormData) {
  const period =
    (formData.get("period") as string | null) ?? firstOfMonth();
  const supabase = await createClient();
  const { error } = await supabase.rpc("compute_monthly_pool", { p_period: period });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/draws");
}

const configSchema = z.object({
  drawId: z.string().uuid(),
  mode: z.enum(["random", "algorithmic"]),
  weighting: z.enum(["most_frequent", "least_frequent"]).nullable().optional(),
});

export async function configureDrawAction(formData: FormData) {
  const parsed = configSchema.safeParse({
    drawId: formData.get("drawId"),
    mode: formData.get("mode"),
    weighting: formData.get("weighting") || null,
  });
  if (!parsed.success) throw new Error("Bad input");

  const supabase = await createClient();
  const { error } = await supabase
    .from("draws")
    .update({
      mode: parsed.data.mode,
      weighting: parsed.data.mode === "algorithmic" ? parsed.data.weighting : null,
    })
    .eq("id", parsed.data.drawId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/draws`);
}

export async function generateNumbersAction(formData: FormData) {
  const drawId = formData.get("drawId") as string;
  const supabase = await createClient();

  const { data: draw } = await supabase
    .from("draws")
    .select("mode, weighting")
    .eq("id", drawId)
    .single<{ mode: string; weighting: string | null }>();
  if (!draw) throw new Error("Draw not found");

  const fn =
    draw.mode === "algorithmic"
      ? await supabase.rpc("generate_algorithmic_numbers", {
          p_weighting: draw.weighting ?? "most_frequent",
        })
      : await supabase.rpc("generate_random_numbers");
  if (fn.error) throw new Error(fn.error.message);

  const { error } = await supabase
    .from("draws")
    .update({ winning_numbers: fn.data })
    .eq("id", drawId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/draws`);
}

export async function simulateDrawAction(formData: FormData) {
  const drawId = formData.get("drawId") as string;
  const supabase = await createClient();
  const { error } = await supabase.rpc("run_draw", { p_draw_id: drawId });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/draws`);
}

export async function publishDrawAction(formData: FormData) {
  const drawId = formData.get("drawId") as string;
  const supabase = await createClient();
  const { error } = await supabase.rpc("publish_draw", { p_draw_id: drawId });
  if (error) throw new Error(error.message);

  // Fire emails — broadcast results + per-winner alerts.
  try {
    const admin = adminClient();
    const { data: draw } = await admin
      .from("draws")
      .select("period, winning_numbers")
      .eq("id", drawId)
      .single<{ period: string; winning_numbers: number[] | null }>();

    if (draw?.winning_numbers) {
      const { data: subs } = await admin
        .from("profiles")
        .select("email, id, subscriptions:subscriptions!inner(status)")
        .in("subscriptions.status", ["active", "trialing"]);
      const emails = ((subs ?? []) as unknown as { email: string }[])
        .map((r) => r.email)
        .filter(Boolean);
      await sendDrawResults(emails, draw.period, draw.winning_numbers);

      const { data: winners } = await admin
        .from("winners")
        .select(`
          prize_amount_minor, currency,
          draw_entry:draw_entries!inner (
            tier,
            user:profiles!inner (email)
          )
        `)
        .eq("draw_entry.draw_id", drawId);

      for (const w of (winners ?? []) as unknown as Array<{
        prize_amount_minor: number;
        currency: string;
        draw_entry: { tier: number; user: { email: string } };
      }>) {
        await sendWinnerAlert(
          w.draw_entry.user.email,
          w.draw_entry.tier,
          w.prize_amount_minor,
          w.currency,
        );
      }
    }
  } catch (err) {
    console.error("[publish emails]", err);
  }

  revalidatePath(`/admin/draws`);
  revalidatePath(`/draws`);
}
