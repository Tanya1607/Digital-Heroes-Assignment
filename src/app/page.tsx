import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MotionSection } from "@/components/motion-section";

type FeaturedCharity = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  hero_img: string | null;
};

export default async function HomePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("charities")
    .select("id, slug, name, tagline, hero_img")
    .eq("featured", true)
    .eq("active", true)
    .limit(2);
  const featured = (data ?? []) as FeaturedCharity[];

  return (
    <main className="flex-1">
      <section className="relative overflow-hidden px-6 pt-24 pb-24 md:pt-32">
        <div className="mx-auto max-w-5xl">
          <MotionSection delay={0}>
            <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium">
              Play · Give · Win
            </p>
          </MotionSection>
          <MotionSection delay={0.05}>
            <h1 className="mt-6 text-5xl md:text-7xl font-semibold leading-[1.05]">
              Your scorecard funds the causes you care about.
            </h1>
          </MotionSection>
          <MotionSection delay={0.12}>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
              GolfDraw turns your last five rounds into monthly prize draws —
              and a portion of every subscription goes straight to the charity
              you choose. No fairways, no plaid. Just numbers, impact, and the
              thrill of the draw.
            </p>
          </MotionSection>
          <MotionSection delay={0.2}>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-accent-foreground font-medium shadow-sm hover:opacity-95 transition"
              >
                Start subscribing →
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center rounded-full border border-border px-6 py-3 text-foreground font-medium hover:bg-muted transition"
              >
                How the draw works
              </Link>
            </div>
          </MotionSection>
        </div>
      </section>

      <section className="border-t border-border bg-muted/40 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <MotionSection delay={0}>
            <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium">
              How it works
            </p>
            <h2 className="mt-3 text-4xl font-semibold">In three steps.</h2>
          </MotionSection>
          <div className="mt-10 grid gap-10 md:grid-cols-3">
            {[
              {
                title: "Subscribe",
                body: "£10/month or £99/year. 50% fuels the prize pool, 10%+ goes to your chosen charity.",
              },
              {
                title: "Log your scores",
                body: "Enter your last five Stableford rounds. Newer scores replace older ones automatically.",
              },
              {
                title: "Win monthly",
                body: "Five numbers drawn each month. Match three, four, or all five.",
              },
            ].map((b, i) => (
              <MotionSection key={b.title} delay={0.08 * i}>
                <div>
                  <h3 className="text-2xl font-semibold text-foreground">
                    {b.title}
                  </h3>
                  <p className="mt-3 text-muted-foreground leading-relaxed">
                    {b.body}
                  </p>
                </div>
              </MotionSection>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <MotionSection delay={0}>
              <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium">
                Charity spotlight
              </p>
              <h2 className="mt-3 text-4xl font-semibold">
                The causes our subscribers are powering right now.
              </h2>
            </MotionSection>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {featured.map((c, i) => (
                <MotionSection key={c.id} delay={0.08 * i}>
                  <Link
                    href={`/charities/${c.slug}`}
                    className="group block overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    {c.hero_img && (
                      <div
                        className="aspect-[16/9] bg-muted bg-cover bg-center"
                        style={{ backgroundImage: `url(${c.hero_img})` }}
                      />
                    )}
                    <div className="p-6">
                      <h3 className="text-2xl font-semibold group-hover:text-primary transition">
                        {c.name}
                      </h3>
                      {c.tagline && (
                        <p className="mt-2 text-muted-foreground">
                          {c.tagline}
                        </p>
                      )}
                    </div>
                  </Link>
                </MotionSection>
              ))}
            </div>
            <div className="mt-10">
              <Link href="/charities" className="text-primary font-medium">
                See the full directory →
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-border bg-primary/5 px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <MotionSection delay={0}>
            <h2 className="text-4xl font-semibold">Ready to play for something bigger?</h2>
            <p className="mt-3 text-muted-foreground">
              Sign up in under a minute. Cancel any time. Your charity wins every month, regardless.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center rounded-full bg-accent px-8 py-3.5 text-accent-foreground font-medium shadow-sm hover:opacity-95 transition"
            >
              Get started →
            </Link>
          </MotionSection>
        </div>
      </section>
    </main>
  );
}
