import { research, write, type Edition, type Paper } from "../lib/editor.ts";
import { illustrate } from "../lib/illustrate.ts";
import { layout } from "../lib/layout.ts";
import { makePuzzles, type Puzzles } from "../lib/puzzles.ts";
import { renderPdf } from "../lib/render.ts";
import type { Settings } from "../lib/settings.ts";
import { admin } from "../lib/supabase/admin.ts";
import { describeForecast, getForecast, type Forecast } from "../lib/weather.ts";

// Writes one edition and saves its PDF. Each step is saved as it finishes, so a crash resumes where it stopped.
export async function makeEdition(id: string, userId: string, settings: Settings, date: string) {
  "use workflow";
  try {
    const forecast = await forecastStep(settings.location);
    const notes = await researchStep(settings, date);
    const { edition, usd } = await writeStep(settings, date, notes.notes, forecast ? describeForecast(forecast) : "");
    const image = await illustrateStep(edition.illustration);
    const yesterday = await yesterdayStep(id, userId);
    await printStep(id, userId, settings, date, { edition, forecast, image, yesterday }, notes.usd + usd);
  } catch (error) {
    await failStep(id, String(error));
  }
}

async function forecastStep(location: string) {
  "use step";
  return getForecast(location);
}

async function researchStep(settings: Settings, date: string) {
  "use step";
  return research(settings, date);
}

async function writeStep(settings: Settings, date: string, notes: string, forecast: string) {
  "use step";
  return write(settings, date, notes, forecast);
}

async function illustrateStep(description: string) {
  "use step";
  return illustrate(description);
}

// Claude and image calls cost money, so retry them only once.
researchStep.maxRetries = 1;
writeStep.maxRetries = 1;
illustrateStep.maxRetries = 1;

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

type Parts = { edition: Edition; forecast: Forecast | null; image: string | null; yesterday: Puzzles | null };

async function printStep(id: string, userId: string, settings: Settings, date: string, parts: Parts, costUsd: number) {
  "use step";
  const paper: Paper = { ...parts.edition, forecast: parts.forecast, puzzles: makePuzzles(id, parts.edition) };
  const { pdf, overflowing } = await renderPdf(layout(settings, date, paper, parts.image, parts.yesterday));
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

async function save(id: string, fields: Record<string, unknown>) {
  const { error } = await admin().from("editions").update(fields).eq("id", id);
  if (error) throw error;
}
