import Link from "next/link";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; check?: string }>;
}) {
  const { next, check } = await searchParams;

  return (
    <div>
      <h1 className="text-4xl font-semibold">Welcome back</h1>
      <p className="mt-2 text-muted-foreground">
        Sign in to log scores, manage your subscription, and see this month&apos;s draw.
      </p>
      {check === "email" && (
        <div className="mt-6 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          Check your inbox — we sent a confirmation link to finish signup.
        </div>
      )}
      <LoginForm next={next} />
      <p className="mt-6 text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/signup" className="text-primary font-medium">
          Create an account
        </Link>
      </p>
    </div>
  );
}
