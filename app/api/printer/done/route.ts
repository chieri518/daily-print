import { printerOwner } from "@/lib/printing/printer";
import { admin } from "@/lib/supabase/admin";

// The printer box reports what happened: { id } when the paper printed, or { id, error } when it didn't.
export async function POST(request: Request) {
  const userId = await printerOwner(request);
  if (!userId) return new Response("Unknown printer key", { status: 401 });
  const { id, error } = (await request.json()) as { id: string; error?: string };
  const report = error ? { print_error: error.slice(0, 500) } : { printed_at: new Date().toISOString() };
  const { error: saveError } = await admin().from("editions").update(report).eq("id", id).eq("user_id", userId);
  if (saveError) throw saveError;
  return new Response(null, { status: 204 });
}
