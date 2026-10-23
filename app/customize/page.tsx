import { redirect } from "next/navigation";
import { Customizer } from "./customizer";
import { getReader, loadSettings } from "@/lib/supabase/server";

export default async function CustomizePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const reader = await getReader();
  if (!reader) redirect("/");
  const settings = await loadSettings(reader);
  const { saved } = await searchParams;

  return (
    <>
      <h1>Customize</h1>
      {saved && <p className="muted">Saved. Your next edition will use this paper.</p>}
      <Customizer initial={settings} />
    </>
  );
}
