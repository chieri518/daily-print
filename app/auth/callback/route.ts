import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google sends the reader back here after sign-in. Exchanging the code sets the session cookie.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(origin);
}
