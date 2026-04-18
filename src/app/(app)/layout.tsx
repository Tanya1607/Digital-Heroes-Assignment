import Link from "next/link";
import { getSession } from "@/lib/auth-helpers";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <aside className="mb-8 flex flex-wrap gap-2 border-b border-border pb-4 text-sm">
        <TabLink href="/dashboard">Overview</TabLink>
        <TabLink href="/scores">Scores</TabLink>
        <TabLink href="/charity">Charity</TabLink>
        <TabLink href="/winnings">Winnings</TabLink>
        <TabLink href="/account">Account</TabLink>
        {!session.hasActiveSubscription && (
          <Link
            href="/pricing"
            className="ml-auto rounded-full bg-accent px-4 py-1.5 text-accent-foreground text-xs font-medium"
          >
            Subscribe
          </Link>
        )}
      </aside>
      {children}
    </div>
  );
}

function TabLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-4 py-1.5 hover:bg-muted transition"
    >
      {children}
    </Link>
  );
}
