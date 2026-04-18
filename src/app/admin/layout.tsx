import Link from "next/link";
import { getSession } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session.role !== "admin") redirect("/dashboard");

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <aside className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4 text-sm">
        <AdminTab href="/admin">Overview</AdminTab>
        <AdminTab href="/admin/users">Users</AdminTab>
        <AdminTab href="/admin/draws">Draws</AdminTab>
        <AdminTab href="/admin/charities">Charities</AdminTab>
        <AdminTab href="/admin/winners">Winners</AdminTab>
        <AdminTab href="/admin/reports">Reports</AdminTab>
      </aside>
      {children}
    </div>
  );
}

function AdminTab({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-full px-4 py-1.5 hover:bg-muted transition">
      {children}
    </Link>
  );
}
