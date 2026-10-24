import { scheduleNext } from "@/lib/schedule";
import { settingsOrDefaults } from "@/lib/settings";
import { admin } from "@/lib/supabase/admin";

// The scheduler. Vercel calls this once a day (see vercel.json) to schedule each reader's next paper.
// Readers who save their settings get scheduled then too, so this is a safety net that keeps every day covered.
export async function GET(request: Request) {
  if (request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { data: papers, error } = await admin().from("papers").select("user_id, settings");
  if (error) throw error;
  for (const paper of papers) await scheduleNext(paper.user_id, settingsOrDefaults(paper.settings));
  return Response.json({ scheduled: papers.length });
}
