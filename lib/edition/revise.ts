// The editor's second look, after the paper is laid out: sections whose stories came out too long (their text shrank
// a lot) or too short (white space left under them) get their stories rewritten to the length that fits, in one Claude
// call, and only once. Most days nothing needs it, and it costs nothing but a layout.
import { z } from "zod";
import { ask } from "./claude.ts";
import { mapStories, type Paper } from "./editor.ts";
import { characters, charactersIn, illustratedSpot, measure, pictureCharacters } from "./space.ts";
import { measureLayout } from "../paper/render.ts";
import type { Fit, Layout } from "../paper/newspaper.tsx";
import { isDesk, READING_LEVELS, TONES, type Settings } from "../settings.ts";

const SMALLEST_SIZE = 9.5; // text shrunk below this, in points, is too long
const LARGEST_GAP = 0.4; // inches of white space under a section's stories (about three lines)

// A section to rewrite: its stories, how many characters they have now, and how many fit.
type Misfit = { title: string; ids: string[]; now: number; target: number };

const Revised = z.object({
  stories: z.array(z.object({ id: z.string(), paragraphs: z.array(z.string()), pullQuote: z.string() })),
});

// Lays the paper out and, if some sections don't fit, has the editor rewrite their stories. Returns the paper to print.
// A failed rewrite prints the paper as written: the layout step still shrinks what's too long.
export async function fitStories(paper: Paper, layout: Layout, notes: string) {
  const { fit } = await measureLayout(paper, layout);
  const off = misfits(paper, layout.settings, fit);
  if (!off.length) return { paper, usd: 0 };
  console.log(`  Rewriting to fit: ${off.map((m) => `${m.title} (${m.now} → ${m.target})`).join(", ")}`);
  return revise(paper, layout.settings, notes, off).catch((error) => {
    console.warn(`  Rewriting to fit failed, so the stories print as written: ${error}`);
    return { paper, usd: 0 };
  });
}

// The sections of stories that don't fit. Your Desk is left as written: it has an update for each followed story.
// Too long: as many characters as the spot holds (see space.ts), at most 90% of now. Too short: what's there, plus
// most of what the white space would hold.
function misfits(paper: Paper, settings: Settings, fit: Fit): Misfit[] {
  const illustrated = illustratedSpot(settings);
  return settings.pages.flatMap((page, i) => {
    const sizes = measure(page, i === 0, settings.paperSize);
    const filled = page.slots.flatMap((section, j) => (section ? [{ section, j }] : []));
    return filled.flatMap(({ section, j }, k) => {
      const stories = paper.pages[i]?.sections[k]?.stories ?? [];
      if (section.kind || isDesk(section) || !stories.length) return [];
      const size = sizes[j]!;
      const spot = `${i}.${j}`;
      const now = stories.reduce((sum, s) => sum + s.paragraphs.join(" ").length, 0);
      const { headline, scene } = paper.illustration;
      const pictured = i === 0 && j === illustrated && scene && stories.some((s) => s.headline === headline);
      const room = characters(size, stories.length) - (pictured ? pictureCharacters(size.width) : 0);
      const gap = fit.space?.[spot] ?? 0;
      const fontSize = fit.fontSizes[spot] ?? 10;
      const target =
        fontSize < SMALLEST_SIZE
          ? Math.min(room, Math.round(now * 0.9))
          : fontSize === 10 && gap >= LARGEST_GAP
            ? now + charactersIn(size.width, gap * 0.9)
            : now;
      return target === now ? [] : [{ title: section.title, ids: stories.map((s) => s.id), now, target }];
    });
  });
}

// Rewrites the misfits' stories to their targets, in the reader's writing model, keeping everything but their
// paragraphs and pull quotes.
async function revise(paper: Paper, settings: Settings, notes: string, off: Misfit[]) {
  const stories = new Map(paper.pages.flatMap((p) => p.sections.flatMap((s) => s.stories)).map((s) => [s.id, s]));
  const say = (n: number) => n.toLocaleString("en-US");
  const sections = off.map(({ title, ids, now, target }) => {
    const told = ids.map((id) => {
      const { headline, paragraphs, pullQuote } = stories.get(id)!;
      return JSON.stringify({ id, headline, paragraphs, pullQuote });
    });
    const change = target < now ? "too long for its space" : "too short: white space is left under it";
    return `## ${title}: ${say(now)} characters, ${change}. Make it between ${say(Math.round(target * 0.95))} and ${say(target)}.\n${told.join("\n")}`;
  });
  const { text, usd } = await ask(
    `You are the editor of "${settings.name}", a printed newspaper. Today's stories have been laid out on paper, and these sections don't fit their space. Rewrite their stories to the lengths given.

Rules:
- A section's length is the characters of its stories' paragraphs, spaces included. Stay within the range: text over it shrinks on paper, and text under it leaves white space.
- To shorten, cut the least important sentences and paragraphs. Keep the main facts and each story's first paragraph, and keep the first story at least half the section.
- To lengthen, add facts from the research notes: more detail, context, a quote. Never pad, never repeat, and never add a fact that isn't in the notes. If the notes have nothing more worth telling, return the story as it is.
- Keep the tone (${TONES[settings.tone].guide}) and reading level (${READING_LEVELS[settings.readingLevel]}).
- A story of 3 or more paragraphs keeps a pull quote copied word for word from its third paragraph or later; otherwise it's empty.
- Return every story below by its id, with its new paragraphs and pull quote.

${sections.join("\n\n")}

Research notes:
${notes}`,
    { label: "Rewriting to fit", model: settings.model, schema: Revised },
  );
  const allowed = new Set(off.flatMap((m) => m.ids));
  const revised = new Map(
    Revised.parse(JSON.parse(text))
      .stories.filter((s) => allowed.has(s.id) && s.paragraphs.length)
      .map((s) => [s.id, s]),
  );
  const pages = mapStories(paper.pages, (s) => {
    const r = revised.get(s.id);
    return r ? { ...s, paragraphs: r.paragraphs, pullQuote: r.pullQuote } : s;
  });
  return { paper: { ...paper, pages }, usd };
}
