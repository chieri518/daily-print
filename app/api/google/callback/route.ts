import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connect } from "@/lib/extras/google";
import { admin } from "@/lib/supabase/admin";
import { getReader } from "@/lib/supabase/server";

// Google sends the reader back here. Saves the connection and returns to the Customize page.
export async function GET(request: Request) {
  const reader = await getReader();
  if (!reader) redirect("/");
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const cookieStore = await cookies();
  if (!code || url.searchParams.get("state") !== cookieStore.get("google_state")?.value)
    redirect("/customize?google=failed");
  cookieStore.delete("google_state");

  const refreshToken = await connect(code, `${url.origin}/api/google/callback`);
  const { error } = await admin()
    .from("google_connections")
    .upsert({ user_id: reader.id, refresh_token: refreshToken });
  if (error) throw error;
  redirect("/customize?google=connected");
}
