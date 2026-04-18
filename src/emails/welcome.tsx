import {
  Body,
  Container,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export function WelcomeEmail({
  name,
  appUrl,
}: {
  name: string;
  appUrl: string;
}) {
  return (
    <Html>
      <Preview>Welcome to GolfDraw — your charity is already winning.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Welcome, {name || "friend"}.</Heading>
          <Text style={p}>
            You&apos;re in. Your charity starts benefiting from your very first
            payment, regardless of whether your numbers come up.
          </Text>
          <Section style={{ marginTop: 32 }}>
            <Link href={`${appUrl}/pricing`} style={button}>
              Complete your subscription →
            </Link>
          </Section>
          <Text style={footer}>— The GolfDraw team</Text>
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
};
const footer = { marginTop: 40, color: "#9ca0a8", fontSize: 12 };
