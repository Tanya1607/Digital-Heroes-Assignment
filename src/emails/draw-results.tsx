import {
  Body,
  Container,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

export function DrawResultsEmail({
  period,
  numbers,
  appUrl,
}: {
  period: string;
  numbers: number[];
  appUrl: string;
}) {
  return (
    <Html>
      <Preview>{`The ${period} draw is live — see if you matched.`}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>{`The ${period} draw is live.`}</Heading>
          <Text style={p}>
            Winning numbers:{" "}
            <strong style={{ letterSpacing: 4 }}>{numbers.join("  ·  ")}</strong>
          </Text>
          <Text style={p}>
            Match any three to win. Log in to see your entry and any winnings.
          </Text>
          <Link href={`${appUrl}/draws/${period}`} style={button}>
            View results →
          </Link>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#fcfaf6", fontFamily: "Inter, Arial" };
const container = { margin: "40px auto", padding: 32, maxWidth: 560 };
const h1 = { fontSize: 28, color: "#141a1c", letterSpacing: "-0.02em" };
const p = { fontSize: 16, color: "#55595f", lineHeight: 1.6 };
const button = {
  display: "inline-block",
  backgroundColor: "#0e6856",
  color: "#fcfaf6",
  padding: "12px 22px",
  borderRadius: 999,
  textDecoration: "none",
  fontWeight: 600,
  marginTop: 20,
};
