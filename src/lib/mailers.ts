import { resend, FROM_EMAIL } from "@/lib/resend";
import { WelcomeEmail } from "@/emails/welcome";
import { DrawResultsEmail } from "@/emails/draw-results";
import { WinnerEmail } from "@/emails/winner";
import { formatMoney } from "@/lib/utils";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function sendWelcome(to: string, name: string) {
  if (!process.env.RESEND_API_KEY) return;
  await resend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Welcome to GolfDraw",
    react: WelcomeEmail({ name, appUrl: appUrl() }),
  });
}

export async function sendDrawResults(
  recipients: string[],
  period: string,
  numbers: number[],
) {
  if (!process.env.RESEND_API_KEY || recipients.length === 0) return;
  await resend().batch.send(
    recipients.map((to) => ({
      from: FROM_EMAIL,
      to,
      subject: `GolfDraw ${period} — results are in`,
      react: DrawResultsEmail({ period, numbers, appUrl: appUrl() }),
    })),
  );
}

export async function sendWinnerAlert(
  to: string,
  tier: number,
  amountMinor: number,
  currency: string,
) {
  if (!process.env.RESEND_API_KEY) return;
  await resend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `You won a ${tier}-number match`,
    react: WinnerEmail({
      tier,
      amount: formatMoney(amountMinor, currency),
      currency,
      appUrl: appUrl(),
    }),
  });
}
