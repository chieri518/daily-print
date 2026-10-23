import { redirect } from "next/navigation";
import { Customizer } from "./customizer";
import { getReader, loadSettings } from "@/lib/supabase/server";

export default async function CustomizePage() {
  const reader = await getReader();
  if (!reader) redirect("/");
  return (
    <>
      <h1>Customize</h1>
      <Customizer initial={await loadSettings(reader)} />
    </>
  );
}
