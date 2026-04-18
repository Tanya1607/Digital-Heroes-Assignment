import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/signup",
  "/how-it-works",
  "/pricing",
  "/charities",
];

const ADMIN_PREFIX = "/admin";
const SUBSCRIBER_PREFIX = ["/dashboard", "/scores", "/winnings", "/account", "/charity"];

function isPublic(pathname: string) {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/charities/")) return true;
  if (pathname.startsWith("/api/stripe/webhook")) return true;
  if (pathname.startsWith("/api/cron/")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/auth/")) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { response, user, supabase } = await updateSession(request);

  if (isPublic(pathname)) return response;

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith(ADMIN_PREFIX)) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  if (SUBSCRIBER_PREFIX.some((p) => pathname.startsWith(p))) {
    // subscription gating is enforced at the page/route level (where we
    // can show a friendly upgrade prompt) — proxy only handles auth.
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
