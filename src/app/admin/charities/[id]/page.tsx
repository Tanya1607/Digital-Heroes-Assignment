import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CharityEditor } from "../charity-form";

export default async function EditCharityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("charities")
    .select("id, slug, name, tagline, description, body, hero_img, featured, active")
    .eq("id", id)
    .maybeSingle<{
      id: string;
      slug: string;
      name: string;
      tagline: string | null;
      description: string;
      body: string | null;
      hero_img: string | null;
      featured: boolean;
      active: boolean;
    }>();
  if (!data) notFound();

  return (
    <div>
      <h1 className="text-3xl font-semibold">Edit {data.name}</h1>
      <div className="mt-8">
        <CharityEditor charity={data} />
      </div>
    </div>
  );
}
