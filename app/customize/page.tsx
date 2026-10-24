import { redirect } from "next/navigation";
import { Customizer } from "./customizer";
import { admin } from "@/lib/supabase/admin";
import { getReader, loadSettings } from "@/lib/supabase/server";

export default async function CustomizePage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const reader = await getReader();
  if (!reader) redirect("/");
  const { data } = await admin().from("google_connections").select("user_id").eq("user_id", reader.id).maybeSingle();
  const { google } = await searchParams;
  return (
    <>
      <h1>Customize</h1>
      {google === "failed" && <p className="muted">Connecting Google Calendar didn't work. Please try again.</p>}
      <Customizer initial={await loadSettings(reader)} googleConnected={!!data} />
    </>
  );
}
