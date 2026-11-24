import type { Layout } from "../paper/newspaper.tsx";
import { isDesk } from "../settings.ts";
import { withIds, type Paper } from "./editor.ts";

// How far back the paper remembers what the reader has read.
export const RECALL_DAYS = 14;

// One story the reader has read, with the later stories that continued it: the latest one's id, headline and deck,
// its section, and each day (YYYY-MM-DD) it ran.
export type Thread = { id: string; headline: string; deck: string; section: string; days: string[] };

// A ready edition, as saved.
export type Earlier = { id: string; day: string; content: Paper; layout: Layout | null };

// What the reader has already read, from their recent editions (newest first): one thread per story, joining the
// stories that continue each other. Only the newest edition of each day counts as read, so papers made while testing
// don't hide stories the reader never saw; the others still join threads, so a thread doesn't break where a story
// continued one in them. Your Desk is left out: its updates are meant to repeat.
export function recall(editions: Earlier[]): Thread[] {
  const threads = new Map<string, Thread>(); // by the id of each thread's first story
  const first = new Map<string, string>(); // each story's thread, by the id of its first story
  for (const e of [...editions].reverse()) {
    const read = editions.find((f) => f.day === e.day) === e;
    if (!e.layout) continue; // made before layouts were saved, so its sections are unknown
    // The editor writes a section for each filled spot, in order.
    const filled = e.layout.settings.pages.map((p) => p.slots.filter((s) => !!s));
    withIds(e.content.pages, e.id).forEach((page, i) =>
      page.sections.forEach(({ stories }, k) => {
        const section = filled[i]?.[k];
        if (!section || isDesk(section)) return;
        for (const { id, headline, deck, continues } of stories) {
          const thread = (continues && first.get(continues)) || id;
          first.set(id, thread);
          if (!read) continue;
          const days = threads.get(thread)?.days ?? [];
          const day = days.includes(e.day) ? [] : [e.day];
          threads.set(thread, { id, headline, deck, section: section.title, days: [...days, ...day] });
        }
      }),
    );
  }
  return [...threads.values()];
}
