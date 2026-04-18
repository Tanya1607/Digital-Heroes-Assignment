"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { sendWelcome } from "@/lib/mailers";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  fullName: z.string().min(1).max(120),
  charityId: z.string().uuid(),
  charityPct: z.coerce.number().min(10).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function signupAction(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    charityId: formData.get("charityId"),
    charityPct: formData.get("charityPct"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues.map((i) => i.message).join("; ") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });
  if (error) return { error: error.message };

  // Use service role to set charity choice immediately (before email confirmation).
  if (data.user) {
    await adminClient()
      .from("profiles")
      .update({
        charity_id: parsed.data.charityId,
        charity_pct: parsed.data.charityPct,
        full_name: parsed.data.fullName,
      })
      .eq("id", data.user.id);

    try {
      await sendWelcome(parsed.data.email, parsed.data.fullName);
    } catch (err) {
      console.error("[welcome email]", err);
    }
  }

  if (data.session) {
    redirect("/pricing?new=1");
  }
  redirect("/login?check=email");
}

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter a valid email and password." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  const next = (formData.get("next") as string | null) ?? "/dashboard";
  revalidatePath("/", "layout");
  redirect(next);
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
