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

  const { plan } = (await request.json()) as { plan: "monthly" | "yearly" };
  if (!["monthly", "yearly"].includes(plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  const admin = adminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("id, email, stripe_customer_id")
    .eq("id", user.id)
    .single<{ id: string; email: string; stripe_customer_id: string | null }>();
  if (!profile) {
    return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  }

  let customerId = profile.stripe_customer_id ?? undefined;
  if (!customerId) {
    const customer = await stripe().customers.create({
      email: profile.email,
      metadata: { user_id: profile.id },
    });
    customerId = customer.id;
    await admin
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", profile.id);
  }

  const priceId =
    plan === "monthly"
      ? process.env.STRIPE_PRICE_MONTHLY!
      : process.env.STRIPE_PRICE_YEARLY!;

  const origin = process.env.NEXT_PUBLIC_APP_URL!;
  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?subscribed=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
    subscription_data: { metadata: { user_id: profile.id, plan } },
    metadata: { user_id: profile.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
