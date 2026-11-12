import { FatalError, sleep } from "workflow";
import { assemble, research, write, type Edition, type Followed, type Paper } from "../lib/editor.ts";
import { birthdays } from "../lib/google.ts";
import { drawPictures } from "../lib/illustrate.ts";
import { step } from "../lib/log.ts";
import type { Layout } from "../lib/paper.tsx";
import type { Puzzles } from "../lib/puzzles.ts";
import { renderPdf } from "../lib/render.ts";
import { knownWordsFor, settingsFor, type Settings } from "../lib/settings.ts";
import { admin } from "../lib/supabase/admin.ts";
import { today } from "../lib/today.ts";
import { describeForecast, getForecast, type Forecast } from "../lib/weather.ts";

// Writes one edition and saves its PDF. Each step is saved as it finishes, so a crash resumes where it stopped.
// The edition's status in the database is the only control: before each costly stage the workflow checks that the
// edition is still "writing", and quits if the reader pressed Stop.
// `date` is printed on the masthead; `day` (YYYY-MM-DD) is the same date, for looking up birthdays.
export async function makeEdition(id: string, userId: string, settings: Settings, date: string, day: string) {
  "use workflow";
  try {
    await stillWritingStep(id);
    const followed = await followedStep(userId);
    const [forecast, notes] = await Promise.all([
      forecastStep(settings.location, settings.temperature),
      researchStep(settings, date, followed),
    ]);
    await stillWritingStep(id);
    const forecastText = forecast ? describeForecast(forecast) : "";
    const { edition, usd } = await writeStep(settings, userId, date, notes.notes, forecastText, followed);
    await stillWritingStep(id);
    const images = await picturesStep(settings, edition);
    const yesterday = await yesterdayStep(id, userId);
    const names = await birthdaysStep(userId, day);
    await printStep(id, userId, settings, date, { edition, forecast, images, yesterday, names }, notes.usd + usd);
  } catch (error) {
    await failStep(id, String(error));
  }
}

// A paper for the printer box: sleeps (using nothing) until 20 minutes before its print time, then makes the edition
// with the reader's settings as they are by then. Stopping it while it sleeps cancels it.
export async function scheduledEdition(id: string, userId: string, printAt: string) {
  "use workflow";
  await sleep(new Date(Date.parse(printAt) - 20 * 60 * 1000));
  const woken = await wakeStep(id, userId, printAt);
  if (woken) await makeEdition(id, userId, woken.settings, woken.date, woken.day);
}

// Starts writing a scheduled edition, unless the reader stopped it. Returns its settings, and the date of its print time.
async function wakeStep(id: string, userId: string, printAt: string) {
  "use step";
  const db = admin();
  const { data: started } = await db
    .from("editions")
    .update({ status: "writing" })
    .eq("id", id)
    .eq("status", "scheduled")
    .select("id");
  if (!started?.length) return null; // stopped while it slept
  const settings = await settingsFor(db, userId);
  return { settings, ...today(settings.timeZone, new Date(printAt)) };
}

// Quits the workflow if the reader stopped this edition. A step already running when they press Stop still finishes.
async function stillWritingStep(id: string) {
  "use step";
  const { data, error } = await admin().from("editions").select("status").eq("id", id).single();
  if (error) throw error;
  if (data.status !== "writing") throw new FatalError("Stopped by the reader");
}

async function forecastStep(location: string, temperature: Settings["temperature"]) {
  "use step";
  return step("Getting the forecast", () => getForecast(location, temperature));
}

// The stories the reader follows, for Your Desk.
async function followedStep(userId: string): Promise<Followed[]> {
  "use step";
  const { data, error } = await admin()
    .from("followed_stories")
    .select("headline, deck, created_at")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw error;
  return data.map((f) => ({ headline: f.headline, deck: f.deck, since: f.created_at.slice(0, 10) }));
}

async function researchStep(settings: Settings, date: string, followed: Followed[]) {
  "use step";
  return step("Researching the news", () => research(settings, date, followed));
}

async function writeStep(
  settings: Settings,
  userId: string,
  date: string,
  notes: string,
  forecast: string,
  followed: Followed[],
) {
  "use step";
  const known = await knownWordsFor(admin(), userId);
  return step("Writing the edition", () => write(settings, date, notes, forecast, followed, known));
}

async function picturesStep(settings: Settings, edition: Edition) {
  "use step";
  return step("Drawing the pictures", () => drawPictures(settings, edition));
}

// Claude and image calls cost money, so retry them only once.
researchStep.maxRetries = 1;
writeStep.maxRetries = 1;
picturesStep.maxRetries = 1;

// The puzzles from the reader's previous edition, whose answers this paper prints.
async function yesterdayStep(id: string, userId: string) {
  "use step";
  const { data } = await admin()
    .from("editions")
    .select("content")
    .eq("user_id", userId)
    .eq("status", "ready")
    .neq("id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data?.content as Paper | undefined)?.puzzles ?? null) as Puzzles | null;
}

// Today's birthdays, if the reader connected their Google Calendar. A problem with Google never stops the paper.
async function birthdaysStep(userId: string, day: string) {
  "use step";
  const { data } = await admin().from("google_connections").select("refresh_token").eq("user_id", userId).maybeSingle();
  if (!data) return [];
  try {
    return await birthdays(data.refresh_token, day);
  } catch (error) {
    console.warn(`Couldn't read birthdays: ${error}`);
    return [];
  }
}

type Parts = {
  edition: Edition;
  forecast: Forecast | null;
  images: { illustration: string | null; comic: string | null };
  yesterday: Puzzles | null;
  names: string[]; // today's birthdays
};

async function printStep(id: string, userId: string, settings: Settings, date: string, parts: Parts, costUsd: number) {
  "use step";
  const paper = assemble(parts.edition, parts.forecast, id, parts.names);
  const layout: Layout = { settings, date, yesterday: parts.yesterday, pictures: parts.images, fit: null };
  const { pdf, fit, overflowing } = await step("Printing the PDF", () => renderPdf(paper, layout));
  if (overflowing.length) console.warn(`Edition ${id}: text is cut off on page ${overflowing.join(", ")}.`);
  // The PDF for printing. The Paper page draws the edition again from its text and layout, with the pictures from storage.
  await upload(`${userId}/${id}.pdf`, pdf, "application/pdf");
  const pictures = {
    illustration: await uploadPicture(`${userId}/${id}-illustration`, parts.images.illustration),
    comic: await uploadPicture(`${userId}/${id}-comic`, parts.images.comic),
  };
  await save(id, { status: "ready", content: paper, layout: { ...layout, pictures, fit }, cost_usd: costUsd });
}

// Saves a picture drawn as a data URL, and returns its path in storage.
async function uploadPicture(path: string, dataUrl: string | null) {
  const [, type, base64] = dataUrl?.match(/^data:(.+);base64,(.*)$/) ?? [];
  if (!type || !base64) return null;
  await upload(path, Buffer.from(base64, "base64"), type);
  return path;
}

async function upload(path: string, body: Uint8Array, contentType: string) {
  const { error } = await admin().storage.from("editions").upload(path, body, { contentType, upsert: true });
  if (error) throw error;
}

async function failStep(id: string, error: string) {
  "use step";
  await save(id, { status: "failed", error });
}

// Only finishes editions that are still being written, so one the reader stopped stays stopped.
async function save(id: string, fields: Record<string, unknown>) {
  const { error } = await admin().from("editions").update(fields).eq("id", id).eq("status", "writing");
  if (error) throw error;
}
