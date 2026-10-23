import { z } from "zod";
import { ask } from "./claude.ts";
import type { Puzzles } from "./puzzles.ts";
import { FEATURES, MAIN_STORY_WORDS, READING_LEVELS, slotWords, TONES, type Settings } from "./settings.ts";
import type { Forecast } from "./weather.ts";

const Story = z.object({
  label: z.string().describe('Small tag above the headline, e.g. "Editorial" or "On This Day". Empty for plain news.'),
  headline: z.string(),
  deck: z.string().describe("One-sentence subheadline"),
  paragraphs: z.array(z.string()),
  sources: z.array(z.object({ name: z.string(), url: z.string() })),
});

const Edition = z.object({
  illustration: z
    .string()
    .describe("Description of a black-and-white illustration for the first story on the front page"),
  weatherTip: z
    .string()
    .describe(
      'One friendly line on what to wear or bring today, from the forecast, e.g. "Rain after lunch: take an umbrella."',
    ),
  pages: z
    .array(z.object({ slots: z.array(z.object({ stories: z.array(Story) })) }))
    .describe("Every page and slot from the plan, in the same order"),
  crossword: z
    .array(z.object({ answer: z.string().describe("One word, letters only, 3 to 9 letters"), clue: z.string() }))
    .describe("12 crossword answers with short clues, mostly about today's stories"),
  wordSearch: z.array(z.string()).describe("10 single words of 4 to 10 letters from today's stories"),
  trivia: z
    .array(z.object({ question: z.string(), answer: z.string().describe("A few words") }))
    .describe("5 quiz questions about today's stories"),
});

export type Story = z.infer<typeof Story>;
export type Edition = z.infer<typeof Edition>;

// Everything that goes into a printed edition. Saved with the edition, so tomorrow's paper can print the answers.
export type Paper = Edition & { forecast: Forecast | null; puzzles: Puzzles };

// Every section of stories in the paper. Weather and puzzles are made separately.
function sectionList(settings: Settings) {
  return settings.pages
    .flatMap((p) => p.slots.filter((s) => !s.kind))
    .map((s) => `- ${s.title}: ${s.about}${s.sources?.length ? `. Prefer these sources: ${s.sources.join(", ")}` : ""}`)
    .join("\n");
}

// The page plan: which section goes in each slot, and how many words fit there.
function pagePlan(settings: Settings) {
  return settings.pages
    .map((page, i) => {
      const slots = page.slots.map((s, j) =>
        s.kind
          ? `  - Slot ${j + 1}: ${FEATURES[s.kind].title}. Made automatically: leave its stories empty.`
          : `  - Slot ${j + 1}: ${s.title} (${s.about}). About ${slotWords(i, page.layout, j)} words.`,
      );
      return `Page ${i + 1}${i === 0 ? " (front page, below the masthead)" : ""}:\n${slots.join("\n")}`;
    })
    .join("\n");
}

// What the reader asked for beyond the page plan, for both steps.
function preferences(settings: Settings) {
  return [
    settings.trustedSources.length && `Prefer these sources: ${settings.trustedSources.join(", ")}.`,
    settings.blockedSources.length && `Never use these sources: ${settings.blockedSources.join(", ")}.`,
    settings.brief && `The reader's brief to the editor:\n${settings.brief}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// Step 1: research today's news with web search. Returns notes, not articles.
export async function research(settings: Settings, date: string) {
  const { text: notes, usd } = await ask(
    `Today is ${date}. You are researching a personal newspaper for a reader in ${settings.location}.
Find the most important news from the last 24 hours for each section:
${sectionList(settings)}

For every story, give the key facts and the source names and URLs. Write notes, not articles.
${preferences(settings)}`,
    { search: true },
  );
  return { notes, usd };
}

// Step 2: edit and write the edition from the notes. Also writes the weather tip and the words for the puzzles.
export async function write(settings: Settings, date: string, notes: string, forecast: string) {
  const { text, usd } = await ask(
    `You are the editor of "${settings.name}", a printed newspaper made for one reader in ${settings.location}.
Today is ${date}. Write today's edition from the research notes below.

The paper has ${settings.pages.length} pages. Each page is split into slots, and each slot holds one section:
${pagePlan(settings)}

Rules:
- Write in English. Tone: ${TONES[settings.tone].guide}. Reading level: ${READING_LEVELS[settings.readingLevel]}.
- News stories must only use facts from the notes, and must list their sources.
- Pieces you write yourself, such as editorials and analysis, must say so in their label (e.g. "Editorial").
- A slot of under ${MAIN_STORY_WORDS} words holds one story. Bigger slots hold a main story and one or two shorter ones.
- Don't tell the same story in two slots.
- Write like a good newspaper: clear, concrete and short paragraphs.
${preferences(settings)}

The forecast, for the weather tip:
${forecast || "Not available. Leave the weather tip empty."}

Research notes:
${notes}`,
    { schema: Edition },
  );
  return { edition: Edition.parse(JSON.parse(text)), usd };
}
