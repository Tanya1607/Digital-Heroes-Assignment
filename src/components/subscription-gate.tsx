import Link from "next/link";

export function SubscriptionGate({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-accent/30 bg-accent/5 p-10 text-center">
      <h2 className="text-3xl font-semibold">Subscribers only</h2>
      <p className="mt-3 max-w-md mx-auto text-muted-foreground">{message}</p>
      <Link
        href="/pricing"
        className="mt-6 inline-flex rounded-full bg-accent px-6 py-3 text-accent-foreground font-medium"
      >
        See pricing →
      </Link>
    </div>
  );
}
