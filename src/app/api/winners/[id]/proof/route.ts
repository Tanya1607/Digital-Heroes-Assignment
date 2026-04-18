import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: winnerId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Verify the caller owns the winning draw_entry for this winner row.
  const admin = adminClient();
  const { data: winner } = await admin
    .from("winners")
    .select("id, verification, draw_entry:draw_entries!inner(user_id)")
    .eq("id", winnerId)
    .maybeSingle<{
      id: string;
      verification: string;
      draw_entry: { user_id: string } | null;
    }>();
  if (!winner) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (winner.draw_entry?.user_id !== user.id) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (winner.verification !== "pending") {
    return NextResponse.json(
      { error: "already reviewed" },
      { status: 409 },
    );
  }

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "missing file" }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "max 5MB" }, { status: 413 });
  }

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const objectPath = `${user.id}/${winnerId}.${ext}`;

  const { error: upErr } = await admin.storage
    .from("winner-proofs")
    .upload(objectPath, file, { upsert: true, contentType: file.type });
  if (upErr)
    return NextResponse.json({ error: upErr.message }, { status: 500 });

  const { error: updErr } = await admin
    .from("winners")
    .update({ proof_url: objectPath })
    .eq("id", winnerId);
  if (updErr)
    return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, path: objectPath });
}
