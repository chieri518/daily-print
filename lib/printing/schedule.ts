// Scheduling the printer box's paper: each reader's next paper is made shortly before their print time.
// Called once a day by the scheduler (app/api/cron) and whenever a reader saves their settings.
import { start } from "workflow/api";
import { canGenerate } from "../allowed.ts";
import type { Settings } from "../settings.ts";
import { admin } from "../supabase/admin.ts";
import { today } from "../today.ts";
import { scheduledEdition } from "../../workflows/edition.ts";

// Adds the reader's next paper as a "scheduled" edition, and starts a workflow that sleeps until it's time to make it.
// A paper waiting for a print time that changed (or was turned off) is cancelled.
export async function scheduleNext(userId: string, settings: Settings) {
  const db = admin();
  const { data: user } = await db.auth.admin.getUserById(userId);
  const allowed = canGenerate(user.user?.email); // only allowed readers get papers made for them
  const printAt =
    settings.printTime && allowed ? nextPrintAt(settings.printTime, settings.timeZone).toISOString() : null;

  const { data: waiting } = await db
    .from("editions")
    .select("id, print_at")
    .eq("user_id", userId)
    .eq("status", "scheduled");
  const old = (waiting ?? []).filter((e) => !printAt || Date.parse(e.print_at) !== Date.parse(printAt));
  if (old.length) {
    const { error } = await db
      .from("editions")
      .update({ status: "stopped" })
      .in(
        "id",
        old.map((e) => e.id),
      );
    if (error) throw error;
  }
  if (!printAt) return;

  // Already scheduled, being written, or made for this print time? Then there's nothing to do.
  const { data: existing } = await db
    .from("editions")
    .select("id")
    .eq("user_id", userId)
    .eq("print_at", printAt)
    .in("status", ["scheduled", "writing", "ready"]);
  if (existing?.length) return;

  const { day } = today(settings.timeZone, new Date(printAt));
  const { data, error } = await db
    .from("editions")
    .insert({ user_id: userId, day, status: "scheduled", print_at: printAt })
    .select("id")
    .single();
  if (error?.code === "23505") return; // scheduled at the same moment by another call (one paper per print time)
  if (error) throw error;
  await start(scheduledEdition, [data.id, userId, printAt]);
}

// Marks papers that will never finish as failed, so the reader sees why and the next paper can be scheduled: one being
// written for over 30 minutes (its workflow crashed or was lost), and one still waiting after its print time (the
// workflow that should have woken it was lost). A paper made with Generate starts writing when it's made; one for the
// printer box, 20 minutes before its print time. For one reader, or for everyone when `userId` is left out.
export async function sweep(userId?: string) {
  const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();
  const fail = (status: string, error: string) => {
    const query = admin().from("editions").update({ status: "failed", error }).eq("status", status);
    return userId ? query.eq("user_id", userId) : query;
  };
  const [writing, waiting] = await Promise.all([
    // Started over 30 minutes ago: made with Generate before then, or printing over 10 minutes ago (woken 20 before)
    fail("writing", "It took over 30 minutes, so it was given up.").or(
      `and(print_at.is.null,created_at.lt.${ago(30)}),print_at.lt.${ago(10)}`,
    ),
    fail("scheduled", "It was never started: its scheduled job was lost.").lt("print_at", ago(0)),
  ]);
  if (writing.error) throw writing.error;
  if (waiting.error) throw waiting.error;
}

// The next time the reader's clock shows their print time.
function nextPrintAt(printTime: string, timeZone: string) {
  const now = new Date();
  const { day } = today(timeZone, now);
  const atToday = zoned(day, printTime, timeZone);
  if (atToday > now) return atToday;
  const tomorrow = new Date(Date.parse(`${day}T12:00:00Z`) + 86400000).toISOString().slice(0, 10);
  return zoned(tomorrow, printTime, timeZone);
}

// The moment when the clock in `timeZone` shows `day` (YYYY-MM-DD) at `time` (HH:MM).
function zoned(day: string, time: string, timeZone: string) {
  const asUtc = Date.parse(`${day}T${time}:00Z`);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(asUtc);
  const part = (type: string) => Number(parts.find((p) => p.type === type)!.value);
  const shown = Date.UTC(part("year"), part("month") - 1, part("day"), part("hour"), part("minute"));
  return new Date(asUtc - (shown - asUtc)); // shift by the time zone's offset from UTC
}
