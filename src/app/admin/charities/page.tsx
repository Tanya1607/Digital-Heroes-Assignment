import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { deleteCharityAction } from "./actions";

type CharityRow = {
  id: string;
  slug: string;
  name: string;
  featured: boolean;
  active: boolean;
};

export default async function AdminCharitiesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("charities")
    .select("id, slug, name, featured, active")
    .order("name");
  const rows = (data ?? []) as CharityRow[];

  return (
    <div className="space-y-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-semibold">Charities</h1>
          <p className="mt-2 text-muted-foreground">
            Add or edit charities that subscribers can pick.
          </p>
        </div>
        <Link
          href="/admin/charities/new"
          className="rounded-full bg-accent px-5 py-2.5 text-accent-foreground text-sm font-medium"
        >
          Add charity
        </Link>
      </header>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Slug</th>
              <th className="px-4 py-3">Featured</th>
              <th className="px-4 py-3">Active</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                <td className="px-4 py-3 text-center">{c.featured ? "★" : "—"}</td>
                <td className="px-4 py-3 text-center">{c.active ? "✓" : "—"}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <Link
                    href={`/admin/charities/${c.id}`}
                    className="text-primary hover:underline"
                  >
                    Edit
                  </Link>
                  {c.active && (
                    <form action={deleteCharityAction} className="inline">
                      <input type="hidden" name="id" value={c.id} />
                      <button className="text-accent hover:underline">
                        Archive
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
