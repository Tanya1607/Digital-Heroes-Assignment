import { Resend } from "resend";

let cached: Resend | null = null;

export function resend() {
  if (cached) return cached;
  cached = new Resend(process.env.RESEND_API_KEY);
  return cached;
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "no-reply@example.com";
