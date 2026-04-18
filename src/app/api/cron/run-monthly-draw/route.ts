import { NextResponse, type NextRequest } from "next/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function firstOfMonth(d: Date = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export async function GET(request: NextRequest) {
  const auth =
    request.headers.get("authorization") ??
    request.nextUrl.searchParams.get("secret");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (auth !== expected && auth !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = adminClient();
  const period = firstOfMonth();

  const poolRpc = await admin.rpc("compute_monthly_pool", { p_period: period });
  if (poolRpc.error) {
    return NextResponse.json(
      { stage: "compute_monthly_pool", error: poolRpc.error.message },
      { status: 500 },
    );
  }

  const { data: draw } = await admin
    .from("draws")
    .select("id, mode, weighting, status, winning_numbers")
    .eq("period", period)
    .single<{
      id: string;
      mode: string;
      weighting: string | null;
      status: string;
      winning_numbers: number[] | null;
    }>();
  if (!draw) {
    return NextResponse.json({ error: "draw not created" }, { status: 500 });
  }

  // Generate numbers if not already set
  if (!draw.winning_numbers) {
    const numsRpc =
      draw.mode === "algorithmic"
        ? await admin.rpc("generate_algorithmic_numbers", {
            p_weighting: draw.weighting ?? "most_frequent",
          })
        : await admin.rpc("generate_random_numbers");
    if (numsRpc.error) {
      return NextResponse.json(
        { stage: "generate_numbers", error: numsRpc.error.message },
        { status: 500 },
      );
    }
    await admin
      .from("draws")
      .update({ winning_numbers: numsRpc.data })
      .eq("id", draw.id);
  }

  if (draw.status !== "published") {
    const runRpc = await admin.rpc("run_draw", { p_draw_id: draw.id });
    if (runRpc.error) {
      return NextResponse.json(
        { stage: "run_draw", error: runRpc.error.message },
        { status: 500 },
      );
    }
  }

  // Cron intentionally stops at simulation — admin must manually publish.
  return NextResponse.json({ period, draw_id: draw.id, stage: "simulated" });
}
