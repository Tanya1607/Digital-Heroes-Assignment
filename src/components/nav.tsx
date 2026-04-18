import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/(auth)/actions";

export async function Nav() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<{ role: string }>();
    role = data?.role ?? null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="font-semibold text-lg tracking-tight">
          Golf<span className="text-primary">Draw</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <Link href="/charities" className="hover:text-primary">Charities</Link>
          <Link href="/how-it-works" className="hover:text-primary">How it works</Link>
          <Link href="/pricing" className="hover:text-primary">Pricing</Link>
          {user ? (
            <>
              <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
              {role === "admin" && (
                <Link href="/admin" className="text-accent hover:opacity-80">Admin</Link>
              )}
              <form action={logoutAction}>
                <button className="rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-primary">Sign in</Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-4 py-1.5 text-accent-foreground text-xs font-medium"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
