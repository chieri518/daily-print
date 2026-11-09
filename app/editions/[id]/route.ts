import { getReader } from "@/lib/supabase/server";

// "Read PDF" on the Editions page: sends the signed-in reader to a 10-minute link to their edition's PDF.
// It acts as the reader, so they can only open PDFs in their own folder.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const reader = await getReader();
  if (!reader) return new Response("Sign in to read this edition", { status: 401 });
  const { id } = await params;
  const { data, error } = await reader.supabase.storage.from("editions").createSignedUrl(`${reader.id}/${id}.pdf`, 600);
  if (error) return new Response("Edition not found", { status: 404 });
  return Response.redirect(data.signedUrl);
}
