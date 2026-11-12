import { PRINT_WINDOW_MS, printerOwner } from "@/lib/printer";
import { sweep } from "@/lib/schedule";
import { admin } from "@/lib/supabase/admin";

// The printer box asks this every few minutes. Answers with the paper to print, if one is ready, its print time has
// come, and it's less than an hour late (after that the paper is skipped). Otherwise answers "204 No Content".
export async function GET(request: Request) {
  const userId = await printerOwner(request);
  if (!userId) return new Response("Unknown printer key", { status: 401 });
  await sweep(userId); // the box asks every 2 minutes, so a stuck paper is noticed soon

  const now = Date.now();
  const db = admin();
  const { data: edition } = await db
    .from("editions")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "ready")
    .is("printed_at", null)
    .is("print_error", null)
    .lte("print_at", new Date(now).toISOString())
    .gte("print_at", new Date(now - PRINT_WINDOW_MS).toISOString())
    .order("print_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!edition) return new Response(null, { status: 204 });

  const { data, error } = await db.storage.from("editions").createSignedUrl(`${userId}/${edition.id}.pdf`, 600);
  if (error) throw error;
  return Response.json({ id: edition.id, pdf: data.signedUrl });
}
