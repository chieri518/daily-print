import { FatalError } from "workflow";
import { research, write, type Edition, type Paper } from "../lib/editor.ts";
import { birthdays } from "../lib/google.ts";
import { drawPictures } from "../lib/illustrate.ts";
import { layout } from "../lib/layout.ts";
import { step } from "../lib/log.ts";
import { makePuzzles, type Puzzles } from "../lib/puzzles.ts";
import { renderPdf } from "../lib/render.ts";
import type { Settings } from "../lib/settings.ts";
import { admin } from "../lib/supabase/admin.ts";
import { describeForecast, getForecast, type Forecast } from "../lib/weather.ts";

// Writes one edition and saves its PDF. Each step is saved as it finishes, so a crash resumes where it stopped.
// The edition's status in the database is the only control: before each costly stage the workflow checks that the
// edition is still "writing", and quits if the reader pressed Stop.
// `date` is printed on the masthead; `day` (YYYY-MM-DD) is the same date, for looking up birthdays.
export async function makeEdition(id: string, userId: string, settings: Settings, date: string, day: string) {
  "use workflow";
  try {
    await stillWritingStep(id);
    const [forecast, notes] = await Promise.all([
      forecastStep(settings.location, settings.temperature),
      researchStep(settings, date),
    ]);
    await stillWritingStep(id);
    const { edition, usd } = await writeStep(settings, date, notes.notes, forecast ? describeForecast(forecast) : "");
    await stillWritingStep(id);
    const images = await picturesStep(settings, edition);
    const yesterday = await yesterdayStep(id, userId);
    const names = await birthdaysStep(userId, day);
    await printStep(id, userId, settings, date, { edition, forecast, images, yesterday, names }, notes.usd + usd);
  } catch (error) {
    await failStep(id, String(error));
  }
}

// Quits the workflow if the reader stopped this edition. A step already running when they press Stop still finishes.
async function stillWritingStep(id: string) {
  "use step";
  const { data } = await admin().from("editions").select("status").eq("id", id).single();
  if (data?.status !== "writing") throw new FatalError("Stopped by the reader");
}

async function forecastStep(location: string, temperature: Settings["temperature"]) {
  "use step";
  return step("Getting the forecast", () => getForecast(location, temperature));
}

async function researchStep(settings: Settings, date: string) {
  "use step";
  return step("Researching the news", () => research(settings, date));
}

async function writeStep(settings: Settings, date: string, notes: string, forecast: string) {
  "use step";
  return step("Writing the edition", () => write(settings, date, notes, forecast));
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
  const paper: Paper = {
    ...parts.edition,
    forecast: parts.forecast,
    puzzles: makePuzzles(id, parts.edition),
    birthdays: parts.names,
  };
  const { pdf, overflowing } = await step("Printing the PDF", () =>
    renderPdf(layout(settings, date, paper, parts.images, parts.yesterday)),
  );
  if (overflowing.length) console.warn(`Edition ${id}: text is cut off on page ${overflowing.join(", ")}.`);
  const db = admin();
  const upload = await db.storage
    .from("editions")
    .upload(`${userId}/${id}.pdf`, pdf, { contentType: "application/pdf", upsert: true });
  if (upload.error) throw upload.error;
  await save(id, { status: "ready", content: paper, cost_usd: costUsd });
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
