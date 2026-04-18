import {
  Body,
  Container,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

export function WinnerEmail({
  tier,
  amount,
  currency,
  appUrl,
}: {
  tier: number;
  amount: string;
  currency: string;
  appUrl: string;
}) {
  return (
    <Html>
      <Preview>{`You matched ${tier} numbers — time to verify.`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>You matched {tier} numbers.</Heading>
          <Text style={p}>
            Your prize is{" "}
            <strong>
              {amount} {currency}
            </strong>
            . Upload a screenshot from your golf platform as proof, and we&apos;ll
            mark your prize paid once an admin has verified.
          </Text>
          <Link href={`${appUrl}/winnings`} style={button}>
            Upload proof →
          </Link>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#fcfaf6", fontFamily: "Inter, Arial" };
const container = { margin: "40px auto", padding: 32, maxWidth: 560 };
const h1 = { fontSize: 32, color: "#141a1c", letterSpacing: "-0.02em" };
const p = { fontSize: 16, color: "#55595f", lineHeight: 1.6 };
const button = {
  display: "inline-block",
  backgroundColor: "#df513a",
  color: "#fcfaf6",
  padding: "14px 24px",
  borderRadius: 999,
  textDecoration: "none",
  fontWeight: 600,
  marginTop: 16,
};
