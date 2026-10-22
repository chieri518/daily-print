import { research, write, type Edition, type Settings } from "../lib/editor.ts";
import { layout } from "../lib/layout.ts";
import { renderPdf } from "../lib/render.ts";
import { admin } from "../lib/supabase/admin.ts";

// Writes one edition and saves its PDF. Each step is saved as it finishes, so a crash resumes where it stopped.
export async function makeEdition(id: string, userId: string, settings: Settings, date: string) {
  "use workflow";
  try {
    const notes = await researchStep(settings, date);
    const { edition, usd } = await writeStep(settings, date, notes.notes);
    await printStep(id, userId, settings, date, edition, notes.usd + usd);
  } catch (error) {
    await failStep(id, String(error));
  }
}

async function researchStep(settings: Settings, date: string) {
  "use step";
  return research(settings, date);
}

async function writeStep(settings: Settings, date: string, notes: string) {
  "use step";
  return write(settings, date, notes);
}

// Claude calls cost money, so retry them only once.
researchStep.maxRetries = 1;
writeStep.maxRetries = 1;

async function printStep(id: string, userId: string, settings: Settings, date: string, edition: Edition, costUsd: number) {
  "use step";
  const { pdf, overflowing } = await renderPdf(layout(settings, date, edition));
  if (overflowing.length) console.warn(`Edition ${id}: text is cut off on page ${overflowing.join(", ")}.`);
  const db = admin();
  const upload = await db.storage.from("editions").upload(`${userId}/${id}.pdf`, pdf, { contentType: "application/pdf", upsert: true });
  if (upload.error) throw upload.error;
  await save(id, { status: "ready", content: edition, cost_usd: costUsd });
}

async function failStep(id: string, error: string) {
  "use step";
  await save(id, { status: "failed", error });
}

async function save(id: string, fields: Record<string, unknown>) {
  const { error } = await admin().from("editions").update(fields).eq("id", id);
  if (error) throw error;
}
