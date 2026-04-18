"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

type Monthly = { month: string; amount: number };
type Pool = { period: string; pool: number };
type CharityBucket = { name: string; amount: number };

export function ReportsCharts({
  monthlySeries,
  poolSeries,
  charitySeries,
}: {
  monthlySeries: Monthly[];
  poolSeries: Pool[];
  charitySeries: CharityBucket[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Chart title="Monthly charity donations (£)">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={monthlySeries} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
            <XAxis dataKey="month" stroke="rgb(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="rgb(var(--muted-foreground))" fontSize={12} />
            <Tooltip />
            <Line type="monotone" dataKey="amount" stroke="rgb(var(--primary))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Chart>

      <Chart title="Prize pool by month (£)">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={poolSeries} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
            <XAxis dataKey="period" stroke="rgb(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="rgb(var(--muted-foreground))" fontSize={12} />
            <Tooltip />
            <Bar dataKey="pool" fill="rgb(var(--accent))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Chart>

      <Chart title="Donations by charity (£)" className="lg:col-span-2">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart
            data={charitySeries}
            layout="vertical"
            margin={{ top: 8, right: 16, bottom: 8, left: 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--border))" />
            <XAxis type="number" stroke="rgb(var(--muted-foreground))" fontSize={12} />
            <YAxis dataKey="name" type="category" stroke="rgb(var(--muted-foreground))" fontSize={12} />
            <Tooltip />
            <Bar dataKey="amount" fill="rgb(var(--primary))" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Chart>
    </div>
  );
}

function Chart({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-5 ${className ?? ""}`}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {title}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
