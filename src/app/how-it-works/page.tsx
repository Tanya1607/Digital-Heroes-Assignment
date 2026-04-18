export default function HowItWorksPage() {
  const steps = [
    {
      n: "01",
      title: "Subscribe",
      body:
        "£10 a month or £99 a year. Half of every payment funds the monthly prize pool, at least 10% goes straight to the charity you chose, and the rest keeps the platform running.",
    },
    {
      n: "02",
      title: "Log your last five rounds",
      body:
        "Enter Stableford scores (1–45) with a date. Only your five most recent rounds count — a new one pushes the oldest out automatically.",
    },
    {
      n: "03",
      title: "The monthly draw",
      body:
        "Once a month, five numbers are drawn — randomly, or weighted by the scores the community has been playing. Match three, four, or all five.",
    },
    {
      n: "04",
      title: "Win & verify",
      body:
        "Winners upload a screenshot of their scores from the golf platform. An admin reviews and approves, and the prize is paid out.",
    },
    {
      n: "05",
      title: "Your charity wins every month",
      body:
        "Even if your numbers don't come up, your contribution to your chosen cause does. Track your lifetime impact from your dashboard.",
    },
  ];

  return (
    <main className="mx-auto max-w-4xl px-6 py-20">
      <p className="text-sm uppercase tracking-[0.2em] text-primary font-medium">
        How it works
      </p>
      <h1 className="mt-3 text-5xl font-semibold">Simple. Transparent. Fair.</h1>

      <div className="mt-12 space-y-12">
        {steps.map((s) => (
          <div key={s.n} className="grid grid-cols-[auto_1fr] gap-6">
            <span className="text-sm text-muted-foreground font-mono pt-1">
              {s.n}
            </span>
            <div>
              <h3 className="text-2xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{s.body}</p>
            </div>
          </div>
        ))}
      </div>

      <section className="mt-20 rounded-2xl border border-border bg-muted/40 p-8">
        <h2 className="text-2xl font-semibold">Prize pool split</h2>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">5-number match:</span>{" "}
            40% of the pool + any unclaimed jackpot from last month. Rolls over if nobody wins.
          </li>
          <li>
            <span className="font-medium text-foreground">4-number match:</span>{" "}
            35% of the pool. Split equally between all 4-match winners.
          </li>
          <li>
            <span className="font-medium text-foreground">3-number match:</span>{" "}
            25% of the pool. Split equally between all 3-match winners.
          </li>
        </ul>
      </section>
    </main>
  );
}
