import Stripe from "stripe";

let cached: Stripe | null = null;

export function stripe() {
  if (cached) return cached;
  cached = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-03-25.dahlia",
    typescript: true,
  });
  return cached;
}
