import { FatalError, sleep } from "workflow";
import { assemble, research, write, type Edition, type Paper, type Reader } from "../lib/edition/editor.ts";
import { recall, RECALL_DAYS, type Earlier } from "../lib/edition/recall.ts";
import { fitStories } from "../lib/edition/revise.ts";
import { birthdays } from "../lib/extras/google.ts";
import { drawPictures } from "../lib/extras/illustrate.ts";
import { step } from "../lib/edition/log.ts";
import type { Layout } from "../lib/paper/newspaper.tsx";
import type { Puzzles } from "../lib/extras/puzzles.ts";
import { renderPdf } from "../lib/paper/render.ts";
import { knownWordsFor, settingsFor, type Settings } from "../lib/settings.ts";
import { admin } from "../lib/supabase/admin.ts";
import { today } from "../lib/today.ts";
import { describeForecast, getForecast, type Forecast } from "../lib/extras/weather.ts";

// Writes one edition and saves its PDF. Each step is saved as it finishes, so a crash resumes where it stopped.
// The edition's status in the database is the only control: before each costly stage the workflow checks that the
// edition is still "writing", and quits if the reader pressed Stop.
// `date` is printed on the masthead; `day` (YYYY-MM-DD) is the same date, for looking up birthdays.
export async function makeEdition(id: string, userId: string, settings: Settings, date: string, day: string) {
  "use workflow";
  let stage = "Getting started";
  const next = (name: string) => stageStep(id, (stage = name));
  try {
    await next("Researching the news");
    const reader = await readerStep(id, userId);
    const [forecast, notes] = await Promise.all([
      forecastStep(settings.location, settings.temperature),
      researchStep(settings, date, reader),
    ]);
    await next("Writing the stories");
    const forecastText = forecast ? describeForecast(forecast) : "";
    const { edition, usd } = await writeStep(settings, date, notes.notes, forecastText, reader);
    await next("Drawing the pictures");
    const images = await picturesStep(settings, edition);
    const yesterday = await yesterdayStep(id, userId);
    const names = await birthdaysStep(userId, day);
    const parts = { edition, forecast, images, yesterday, names };
    await next("Fitting the stories and printing");
    const fitted = await fitStep(id, settings, date, parts, notes.notes);
    await layoutStep(id, userId, settings, date, fitted.paper, parts, notes.usd + usd + fitted.usd);
  } catch (error) {
    // Errors from Supabase are plain objects, so String() alone would log "[object Object]".
    await failStep(id, stage, (error as { message?: string })?.message ?? String(error));
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

// Notes what the edition is doing now, for the reader to see, and quits the workflow if the reader stopped it.
// One query does both. A step already running when they press Stop still finishes.
async function stageStep(id: string, stage: string) {
  "use step";
  const { data, error } = await admin()
    .from("editions")
    .update({ stage })
    .eq("id", id)
    .eq("status", "writing")
    .select("id");
  if (error) throw error;
  if (!data.length) throw new FatalError("Stopped by the reader");
}

async function forecastStep(location: string, temperature: Settings["temperature"]) {
  "use step";
  return step("Getting the forecast", () => getForecast(location, temperature));
}

// What the editor knows about the reader: the stories they follow (for Your Desk), the hard terms they know, and what
// they've read in their editions of the last two weeks.
async function readerStep(id: string, userId: string): Promise<Reader> {
  "use step";
  const db = admin();
  const since = new Date(Date.now() - RECALL_DAYS * 86_400_000).toISOString().slice(0, 10);
  const [followed, known, editions] = await Promise.all([
    db.from("followed_stories").select("story_id, headline, deck, created_at").eq("user_id", userId).order("created_at"),
    knownWordsFor(db, userId),
    db
      .from("editions")
      .select("id, day, content, layout")
      .eq("user_id", userId)
      .eq("status", "ready")
      .neq("id", id)
      .gte("day", since)
      .order("created_at", { ascending: false }),
  ]);
  if (followed.error) throw followed.error;
  if (editions.error) throw editions.error;
  return {
    followed: followed.data.map((f) => ({
      id: f.story_id,
      headline: f.headline,
      deck: f.deck,
      since: f.created_at.slice(0, 10),
    })),
    known,
    read: recall(editions.data as Earlier[]),
  };
}

async function researchStep(settings: Settings, date: string, reader: Reader) {
  "use step";
  return step("Researching the news", () => research(settings, date, reader));
}

async function writeStep(settings: Settings, date: string, notes: string, forecast: string, reader: Reader) {
  "use step";
  return step("Writing the edition", () => write(settings, date, notes, forecast, reader));
}

async function picturesStep(settings: Settings, edition: Edition) {
  "use step";
  return step("Drawing the pictures", () => drawPictures(settings, edition));
}

// Assembles the paper, lays it out, and rewrites the stories of sections that don't fit (see lib/edition/revise.ts).
async function fitStep(id: string, settings: Settings, date: string, parts: Parts, notes: string) {
  "use step";
  const paper = assemble(parts.edition, parts.forecast, id, parts.names);
  return step("Fitting the stories to the pages", () => fitStories(paper, layoutOf(settings, date, parts), notes));
}

// Claude and image calls cost money, so retry them only once.
researchStep.maxRetries = 1;
writeStep.maxRetries = 1;
picturesStep.maxRetries = 1;
fitStep.maxRetries = 1;

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

// Lays out the paper, saves its PDF and pictures, and finishes the edition. This happens once, when the paper is made:
// the Paper page draws it again with the same fit, and the printer box only downloads the PDF.
async function layoutStep(
  id: string,
  userId: string,
  settings: Settings,
  date: string,
  paper: Paper,
  parts: Parts,
  costUsd: number,
) {
  "use step";
  const layout = layoutOf(settings, date, parts);
  const { pdf, fit, overflowing } = await step("Laying out the paper", () => renderPdf(paper, layout));
  if (overflowing.length) console.warn(`Edition ${id}: text is cut off on page ${overflowing.join(", ")}.`);
  // The PDF for printing. The Paper page draws the edition again from its text and layout, with the pictures from storage.
  await upload(`${userId}/${id}.pdf`, pdf, "application/pdf");
  const pictures = {
    illustration: await uploadPicture(`${userId}/${id}-illustration`, parts.images.illustration),
    comic: await uploadPicture(`${userId}/${id}-comic`, parts.images.comic),
  };
  await save(id, { status: "ready", content: paper, layout: { ...layout, pictures, fit }, cost_usd: costUsd });
}

// The layout to measure and print, before its fit is measured.
const layoutOf = (settings: Settings, date: string, parts: Parts): Layout => ({
  settings,
  date,
  yesterday: parts.yesterday,
  pictures: parts.images,
  fit: null,
});

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

// The reader sees a plain sentence saying which stage went wrong; the technical error goes to the logs.
async function failStep(id: string, stage: string, error: string) {
  "use step";
  console.error(`Edition ${id} failed while ${stage.toLowerCase()}: ${error}`);
  await save(id, { status: "failed", error: `Something went wrong while ${stage.toLowerCase()}. Please try again.` });
}

// Only finishes editions that are still being written, so one the reader stopped stays stopped.
async function save(id: string, fields: Record<string, unknown>) {
  const { error } = await admin().from("editions").update(fields).eq("id", id).eq("status", "writing");
  if (error) throw error;
}
