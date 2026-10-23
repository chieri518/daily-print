import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import defaults from "../../paper.json" with { type: "json" };
import { Settings } from "../settings.ts";

// A Supabase client that acts as the signed-in reader, so row-level security applies.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        // Server Components can't set cookies. That's fine: proxy.ts refreshes the session.
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {}
      },
    },
  });
}

// The signed-in reader, or null.
export async function getReader() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) return null;
  return { supabase, id: data.claims.sub, email: data.claims.email ?? "" };
}

export type Reader = NonNullable<Awaited<ReturnType<typeof getReader>>>;

// Each edition costs real money, so only emails in ALLOWED_EMAILS can generate one.
export function canGenerate(reader: Reader) {
  return (process.env.ALLOWED_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).includes(reader.email.toLowerCase());
}

// The reader's saved settings, or the defaults from paper.json if they have none (or saved an older format).
export async function loadSettings(reader: Reader) {
  const { data } = await reader.supabase.from("papers").select("settings").eq("user_id", reader.id).maybeSingle();
  const saved = Settings.safeParse(data?.settings);
  return saved.success ? saved.data : Settings.parse(defaults);
}
