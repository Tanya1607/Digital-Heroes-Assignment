import { notFound } from "next/navigation";
import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";

type CharityFull = {
  id: string;
  name: string;
  tagline: string | null;
  description: string;
  body: string | null;
  hero_img: string | null;
  featured: boolean;
  events: { title: string; date: string; location?: string }[];
};

export default async function CharityProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("charities")
    .select("id, name, tagline, description, body, hero_img, featured, events")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle<CharityFull>();
  if (!data) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      {data.hero_img && (
        <div
          className="aspect-[21/9] w-full rounded-3xl bg-muted bg-cover bg-center"
          style={{ backgroundImage: `url(${data.hero_img})` }}
        />
      )}
      <div className="mt-8">
        {data.featured && (
          <span className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent">
            Featured charity
          </span>
        )}
        <h1 className="mt-3 text-5xl font-semibold">{data.name}</h1>
        {data.tagline && (
          <p className="mt-2 text-xl text-muted-foreground">{data.tagline}</p>
        )}
        <p className="mt-8 text-lg leading-relaxed">{data.description}</p>
        {data.body && (
          <div className="mt-6 whitespace-pre-wrap leading-relaxed text-muted-foreground">
            {data.body}
          </div>
        )}

        {data.events && data.events.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold">Upcoming events</h2>
            <ul className="mt-4 space-y-3">
              {data.events.map((e, idx) => (
                <li
                  key={idx}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="font-medium">{e.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(e.date), "EEE d MMM yyyy")}
                    {e.location ? ` · ${e.location}` : ""}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
