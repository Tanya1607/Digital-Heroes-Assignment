import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "user" | "admin";
  charity_pct: number;
  created_at: string;
  charity: { name: string } | null;
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("profiles")
    .select("id, email, full_name, role, charity_pct, created_at, charity:charities(name)")
    .order("created_at", { ascending: false });
  if (q) query = query.or(`email.ilike.%${q}%,full_name.ilike.%${q}%`);

  const { data } = await query;
  const users = (data ?? []) as unknown as UserRow[];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Users</h1>
          <p className="mt-2 text-muted-foreground">
            Profiles, roles, and charity choice.
          </p>
        </div>
        <form>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search email or name…"
            className="rounded-full border border-border bg-card px-4 py-2 text-sm"
          />
        </form>
      </header>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Role</th>
              <th className="px-4 py-3 text-left">Charity</th>
              <th className="px-4 py-3 text-right">%</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-border">
                <td className="px-4 py-3">{u.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3 capitalize">{u.role}</td>
                <td className="px-4 py-3">{u.charity?.name ?? "—"}</td>
                <td className="px-4 py-3 text-right">{u.charity_pct}%</td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/users/${u.id}`}
                    className="text-primary hover:underline"
                  >
                    Open →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
