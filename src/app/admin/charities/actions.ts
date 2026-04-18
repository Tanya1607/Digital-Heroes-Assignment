"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const upsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().min(2).max(64).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  tagline: z.string().max(160).optional().nullable(),
  description: z.string().min(10),
  body: z.string().optional().nullable(),
  hero_img: z.string().url().optional().nullable(),
  featured: z.coerce.boolean().optional(),
  active: z.coerce.boolean().optional(),
});

export async function upsertCharityAction(formData: FormData) {
  const parsed = upsertSchema.parse({
    id: formData.get("id") || undefined,
    slug: formData.get("slug"),
    name: formData.get("name"),
    tagline: formData.get("tagline") || null,
    description: formData.get("description"),
    body: formData.get("body") || null,
    hero_img: formData.get("hero_img") || null,
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on" || !formData.get("id"),
  });

  const supabase = await createClient();
  if (parsed.id) {
    await supabase.from("charities").update(parsed).eq("id", parsed.id);
  } else {
    await supabase.from("charities").insert(parsed);
  }
  revalidatePath("/admin/charities");
  revalidatePath("/charities");
}

export async function deleteCharityAction(formData: FormData) {
  const id = formData.get("id") as string;
  const supabase = await createClient();
  await supabase.from("charities").update({ active: false }).eq("id", id);
  revalidatePath("/admin/charities");
  revalidatePath("/charities");
}
