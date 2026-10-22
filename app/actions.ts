"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { start } from "workflow/api";
import { Settings } from "@/lib/editor";
import { canGenerate, createClient, getReader, loadSettings } from "@/lib/supabase/server";
import { today } from "@/lib/today";
import { makeEdition } from "@/workflows/edition";

async function requireReader() {
  const reader = await getReader();
  if (!reader) redirect("/");
  return reader;
}

export async function signIn() {
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error) throw error;
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function saveSettings(form: FormData) {
  const reader = await requireReader();
  const settings = Settings.parse({
    name: form.get("name"),
    typeface: form.get("typeface"),
    location: form.get("location"),
    sections: [0, 1].map((i) => ({ title: form.get(`title${i}`), about: form.get(`about${i}`) })),
  });
  const { error } = await reader.supabase.from("papers").upsert({ user_id: reader.id, settings, updated_at: new Date().toISOString() });
  if (error) throw error;
  redirect("/settings?saved=1");
}

// Starts today's edition in the reader's time zone. It is written in the background and appears in the archive when ready.
export async function generate(form: FormData) {
  const reader = await requireReader();
  if (!canGenerate(reader)) throw new Error("Your account isn't allowed to generate editions yet.");
  const settings = await loadSettings(reader);
  const { date, day } = today(String(form.get("timeZone")));
  const { data, error } = await reader.supabase.from("editions").insert({ user_id: reader.id, day }).select("id").single();
  if (error) throw error;
  await start(makeEdition, [data.id, reader.id, settings, date]);
  revalidatePath("/");
}
