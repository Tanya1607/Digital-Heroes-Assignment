import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { adminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await adminClient()
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single<{ stripe_customer_id: string | null }>();
  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "No Stripe customer." }, { status: 404 });
  }

  const session = await stripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
