import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/30 px-6 py-10 mt-20">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} GolfDraw · A sample build for the
          Digital Heroes trainee assignment.
        </p>
        <div className="flex gap-4">
          <Link href="/charities" className="hover:text-foreground">Charities</Link>
          <Link href="/how-it-works" className="hover:text-foreground">How it works</Link>
          <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
        </div>
      </div>
    </footer>
  );
}
