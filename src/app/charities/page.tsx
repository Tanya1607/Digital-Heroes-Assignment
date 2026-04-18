import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type CharityCard = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  hero_img: string | null;
  featured: boolean;
};

export default async function CharitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("charities")
    .select("id, slug, name, tagline, description, hero_img, featured")
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("name");
  if (q) query = query.ilike("name", `%${q}%`);

  const { data } = await query;
  const charities = (data ?? []) as CharityCard[];

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium">
            Charity directory
          </p>
          <h1 className="mt-3 text-5xl font-semibold">Causes you can power.</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Each subscriber picks one. You can switch any time, and voluntarily
            raise your contribution above the 10% minimum.
          </p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search charities…"
            className="rounded-full border border-border bg-card px-4 py-2 text-sm"
          />
          <button className="rounded-full bg-primary px-4 py-2 text-primary-foreground text-sm">
            Search
          </button>
        </form>
      </header>

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {charities.map((c) => (
          <Link
            key={c.id}
            href={`/charities/${c.slug}`}
            className="group overflow-hidden rounded-2xl border border-border bg-card transition hover:shadow-md"
          >
            {c.hero_img && (
              <div
                className="aspect-[16/10] bg-muted bg-cover bg-center"
                style={{ backgroundImage: `url(${c.hero_img})` }}
              />
            )}
            <div className="p-5">
              <div className="flex items-center gap-2">
                {c.featured && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
                    Featured
                  </span>
                )}
                <h3 className="text-lg font-semibold group-hover:text-primary">
                  {c.name}
                </h3>
              </div>
              {c.tagline && (
                <p className="mt-1 text-sm text-muted-foreground">{c.tagline}</p>
              )}
              <p className="mt-3 text-sm text-muted-foreground line-clamp-3">
                {c.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {charities.length === 0 && (
        <p className="mt-16 text-center text-muted-foreground">
          No charities match that search.
        </p>
      )}
    </main>
  );
}
