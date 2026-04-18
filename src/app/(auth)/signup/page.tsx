import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const supabase = await createClient();
  const { data: charities } = await supabase
    .from("charities")
    .select("id, name, tagline")
    .eq("active", true)
    .order("featured", { ascending: false })
    .order("name");

  return (
    <div>
      <h1 className="text-4xl font-semibold">Join GolfDraw</h1>
      <p className="mt-2 text-muted-foreground">
        Pick a charity, enter your scores, win monthly.
      </p>
      <SignupForm
        charities={
          (charities ?? []) as unknown as {
            id: string;
            name: string;
            tagline: string | null;
          }[]
        }
      />
      <p className="mt-6 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
