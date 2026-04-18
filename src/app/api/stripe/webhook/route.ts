import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { adminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SubRow = {
  id: string;
  plan: "monthly" | "yearly";
  price_amount_minor: number;
  currency: string;
  status: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
};

export async function POST(request: NextRequest) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "bad signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = adminClient();

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await upsertSubscription(admin, sub);
        break;
      }
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe().subscriptions.retrieve(
            session.subscription as string,
          );
          await upsertSubscription(admin, sub);
        }
        break;
      }
      case "invoice.paid": {
        const inv = event.data.object as Stripe.Invoice;
        await recordDonationFromInvoice(admin, inv);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[stripe webhook]", event.type, err);
    return NextResponse.json({ error: "handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function upsertSubscription(
  admin: ReturnType<typeof adminClient>,
  sub: Stripe.Subscription,
) {
  const userId = (sub.metadata?.user_id as string | undefined) ??
    await lookupUserByCustomer(admin, sub.customer as string);
  if (!userId) return;

  const planMeta = sub.metadata?.plan as "monthly" | "yearly" | undefined;
  const item = sub.items.data[0];
  const priceId = item?.price.id;
  const plan: "monthly" | "yearly" =
    planMeta ??
    (priceId === process.env.STRIPE_PRICE_YEARLY ? "yearly" : "monthly");

  const row: SubRow & { user_id: string; stripe_subscription_id: string } = {
    id: sub.id,
    user_id: userId,
    stripe_subscription_id: sub.id,
    plan,
    price_amount_minor: item?.price.unit_amount ?? 0,
    currency: (item?.price.currency ?? "gbp").toUpperCase(),
    status: sub.status,
    current_period_start: item?.current_period_start
      ? new Date(item.current_period_start * 1000).toISOString()
      : null,
    current_period_end: item?.current_period_end
      ? new Date(item.current_period_end * 1000).toISOString()
      : null,
    cancel_at_period_end: sub.cancel_at_period_end,
  };

  await admin
    .from("subscriptions")
    .upsert(row, { onConflict: "stripe_subscription_id" });
}

async function lookupUserByCustomer(
  admin: ReturnType<typeof adminClient>,
  customerId: string,
) {
  const { data } = await admin
    .from("profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle<{ id: string }>();
  return data?.id ?? null;
}

async function recordDonationFromInvoice(
  admin: ReturnType<typeof adminClient>,
  inv: Stripe.Invoice,
) {
  if (inv.status !== "paid" || !inv.customer) return;
  const userId = await lookupUserByCustomer(admin, inv.customer as string);
  if (!userId) return;

  const { data: profile } = await admin
    .from("profiles")
    .select("charity_id, charity_pct")
    .eq("id", userId)
    .single<{ charity_id: string | null; charity_pct: number }>();
  if (!profile?.charity_id) return;

  const amountPaid = inv.amount_paid ?? 0;
  const donation = Math.floor((amountPaid * profile.charity_pct) / 100);
  if (donation <= 0) return;

  const now = new Date();
  const period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);

  await admin.from("donations").insert({
    user_id: userId,
    charity_id: profile.charity_id,
    amount_minor: donation,
    currency: (inv.currency ?? "gbp").toUpperCase(),
    source: "subscription",
    period_month: period,
    stripe_ref: inv.id,
  });
}
