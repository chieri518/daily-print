"use server";

import { refresh, revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { start } from "workflow/api";
import { followedHeadline, type Paper } from "@/lib/edition/editor";
import { MAX_FOLLOWED, Settings } from "@/lib/settings";
import { disconnect } from "@/lib/extras/google";
import { newPrinterKey } from "@/lib/printing/printer";
import { scheduleNext, sweep } from "@/lib/printing/schedule";
import { admin } from "@/lib/supabase/admin";
import { canGenerate } from "@/lib/allowed";
import { createClient, getReader, loadSettings } from "@/lib/supabase/server";
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

export async function saveSettings(json: string) {
  const reader = await requireReader();
  const settings = Settings.parse(JSON.parse(json));
  const { error } = await reader.supabase
    .from("papers")
    .upsert({ user_id: reader.id, settings, updated_at: new Date().toISOString() });
  if (error) throw error;
  await scheduleNext(reader.id, settings); // the next paper for the printer box, or none if the print time is off
}

// Starts today's edition in the reader's time zone. It is written in the background and appears in the archive when ready.
export async function generate(form: FormData) {
  const reader = await requireReader();
  if (!canGenerate(reader.email)) throw new Error("Your account isn't allowed to generate editions yet.");
  // One paper at a time: a double-click or a second tab would otherwise pay for two. A stuck one doesn't count.
  await sweep(reader.id);
  const { count } = await reader.supabase
    .from("editions")
    .select("id", { count: "exact", head: true })
    .eq("status", "writing");
  if (count) throw new Error("A paper is already being written. It appears on the Paper page when it's ready.");
  const settings = await loadSettings(reader);
  const { date, day } = today(String(form.get("timeZone")));
  const { data, error } = await reader.supabase
    .from("editions")
    .insert({ user_id: reader.id, day })
    .select("id")
    .single();
  if (error) throw error;
  await start(makeEdition, [data.id, reader.id, settings, date, day]);
  revalidatePath("/", "layout"); // the Paper and Editions pages
}

// Remembers a hard term the reader knows (the ✓ on the Paper page), so it's never explained again.
export async function knowWord(word: string) {
  const reader = await requireReader();
  const { error } = await reader.supabase
    .from("known_words")
    .upsert({ user_id: reader.id, word: word.toLowerCase() }, { ignoreDuplicates: true });
  if (error) throw error;
}

// Stops an edition that's scheduled or being written. The workflow sees the new status before its next step and quits.
// This works even when the workflow was lost, so an edition never stays "writing" forever.
export async function stopEdition(id: string) {
  const reader = await requireReader();
  const { error } = await reader.supabase.from("editions").select("id").eq("id", id).single(); // only your own
  if (error) throw error;
  const stopped = await admin()
    .from("editions")
    .update({ status: "stopped" })
    .eq("id", id)
    .in("status", ["scheduled", "writing"]);
  if (stopped.error) throw stopped.error;
  revalidatePath("/", "layout"); // the Paper and Editions pages
}

// Follows a story from one of the reader's editions, or stops following it. Updates on followed stories go in Your
// Desk; an update there stands for the story it updates. Returns false if the reader already follows the most allowed.
export async function follow(editionId: string, headline: string, on: boolean) {
  const reader = await requireReader();
  const { data, error } = await reader.supabase.from("editions").select("content").eq("id", editionId).single();
  if (error) throw error;
  const stories = (data.content as Paper).pages.flatMap((p) => p.sections.flatMap((s) => s.stories));
  const story = stories.find((s) => s.headline === headline);
  if (!story) throw new Error("That story isn't in this edition.");
  const followed = () => reader.supabase.from("followed_stories");
  if (on) {
    const { count } = await followed().select("headline", { count: "exact", head: true });
    if ((count ?? 0) >= MAX_FOLLOWED) return false;
    const row = { user_id: reader.id, headline: followedHeadline(story), deck: story.deck };
    const { error } = await followed().upsert(row, { ignoreDuplicates: true });
    if (error) throw error;
  } else {
    const { error } = await followed().delete().eq("headline", followedHeadline(story));
    if (error) throw error;
  }
  refresh(); // the Paper page, with the new follow buttons
  return true;
}

// Stops reading birthdays from the reader's Google Calendar, and tells Google to cancel the access.
export async function disconnectGoogle() {
  const reader = await requireReader();
  const db = admin();
  const { data } = await db.from("google_connections").select("refresh_token").eq("user_id", reader.id).maybeSingle();
  if (data) await disconnect(data.refresh_token);
  const { error } = await db.from("google_connections").delete().eq("user_id", reader.id);
  if (error) throw error;
}

// Makes a new key for the reader's printer box, replacing any old one. It's shown once; only its hash is kept.
export async function createPrinterKey() {
  const reader = await requireReader();
  const { key, hash } = newPrinterKey();
  const { error } = await admin()
    .from("printers")
    .upsert({ user_id: reader.id, key_hash: hash, last_seen_at: null, created_at: new Date().toISOString() });
  if (error) throw error;
  return key;
}
