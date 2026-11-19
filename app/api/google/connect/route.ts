import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectUrl } from "@/lib/extras/google";
import { getReader } from "@/lib/supabase/server";

// Sends the reader to Google to allow reading birthdays from their calendar.
export async function GET(request: Request) {
  if (!(await getReader())) redirect("/");
  const state = crypto.randomUUID(); // checked in the callback, so only this browser can finish the connection
  (await cookies()).set("google_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600 });
  redirect(connectUrl(`${new URL(request.url).origin}/api/google/callback`, state));
}
