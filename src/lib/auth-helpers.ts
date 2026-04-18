import { createClient } from "@/lib/supabase/server";

export type SessionInfo = {
  userId: string | null;
  role: "user" | "admin" | null;
  hasActiveSubscription: boolean;
  profile: {
    id: string;
    email: string;
    full_name: string | null;
    charity_id: string | null;
    charity_pct: number;
  } | null;
};

export async function getSession(): Promise<SessionInfo> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      userId: null,
      role: null,
      hasActiveSubscription: false,
      profile: null,
    };
  }

  const [{ data: profile }, { data: sub }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, role, charity_id, charity_pct")
      .eq("id", user.id)
      .maybeSingle<{
        id: string;
        email: string;
        full_name: string | null;
        role: "user" | "admin";
        charity_id: string | null;
        charity_pct: number;
      }>(),
    supabase
      .from("subscriptions")
      .select("id, status, current_period_end")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .order("current_period_end", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; status: string; current_period_end: string | null }>(),
  ]);

  const hasActive = !!(
    sub &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date())
  );

  return {
    userId: user.id,
    role: profile?.role ?? null,
    hasActiveSubscription: hasActive,
    profile: profile
      ? {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          charity_id: profile.charity_id,
          charity_pct: profile.charity_pct,
        }
      : null,
  };
}
