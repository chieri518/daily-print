import { scheduleNext, sweep } from "@/lib/printing/schedule";
import { settingsOrDefaults } from "@/lib/settings";
import { admin } from "@/lib/supabase/admin";

// The scheduler. Vercel calls this once a day (see vercel.json) to schedule each reader's next paper.
// Readers who save their settings get scheduled then too, so this is a safety net that keeps every day covered.
export async function GET(request: Request) {
  // Without a secret, the header to match would be "Bearer undefined", which anyone can send.
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  await sweep(); // first, so a lost paper doesn't stop its reader's next one being scheduled
  const { data: papers, error } = await admin().from("papers").select("user_id, settings");
  if (error) throw error;
  let failed = 0;
  for (const paper of papers) {
    // One reader's error (say, a bad time zone) mustn't stop everyone else's paper.
    await scheduleNext(paper.user_id, settingsOrDefaults(paper.settings)).catch((error) => {
      console.error(`Couldn't schedule ${paper.user_id}'s paper:`, error);
      failed++;
    });
  }
  return Response.json({ scheduled: papers.length - failed, failed });
}
