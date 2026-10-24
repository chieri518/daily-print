import { z } from "zod";
import { ask } from "./claude.ts";
import type { Puzzles } from "./puzzles.ts";
import {
  FEATURES,
  illustratedSlot,
  LAYOUTS,
  MAIN_STORY_WORDS,
  READING_LEVELS,
  slotWords,
  TONES,
  type Settings,
} from "./settings.ts";
import type { Forecast } from "./weather.ts";

const Story = z.object({
  label: z.string().describe('Small tag above the headline, e.g. "Editorial" or "On This Day". Empty for plain news.'),
  headline: z.string(),
  deck: z.string().describe("One-sentence subheadline"),
  paragraphs: z.array(z.string()),
  sources: z.array(z.object({ name: z.string(), url: z.string() })),
});

// What the editor writes: the stories, and the picture that goes with one of them.
const Stories = z.object({
  illustration: z
    .object({
      headline: z.string().describe("The headline of the story it goes with, exactly as you wrote it. Empty for none"),
      scene: z.string().describe("What the black-and-white illustration shows. Empty for none"),
    })
    .describe("A picture for one light or neutral story; see the rules"),
  pages: z
    .array(z.object({ slots: z.array(z.object({ stories: z.array(Story) })) }))
    .describe("Every page and slot from the plan, in the same order"),
});

// The small extras, written alongside the stories by a faster model: the weather tip, puzzles, quiz, word and comic.
const Extras = z.object({
  weatherTip: z
    .string()
    .describe(
      'One friendly line on what to wear or bring today, from the forecast, e.g. "Rain after lunch: take an umbrella."',
    ),
  crossword: z
    .array(z.object({ answer: z.string().describe("One word, letters only, 3 to 9 letters"), clue: z.string() }))
    .describe("12 crossword answers with short clues, mostly about today's stories"),
  wordSearch: z.array(z.string()).describe("10 single words of 4 to 10 letters from today's stories"),
  trivia: z
    .array(z.object({ question: z.string(), answer: z.string().describe("A few words") }))
    .describe("5 quiz questions about today's stories"),
  jumble: z.array(z.string()).describe("4 single words of 5 to 7 letters from today's stories, to scramble"),
  wordOfTheDay: z
    .object({
      word: z.string(),
      partOfSpeech: z.string().describe('e.g. "noun"'),
      definition: z.string(),
      example: z.string().describe("A sentence using the word, ideally about today's news"),
    })
    .describe("An interesting English word that's useful, not obscure"),
  comic: z
    .object({
      story: z.string().describe("The light news story the joke is about"),
      panels: z
        .array(
          z.object({
            scene: z.string().describe("What the cast is doing in this panel"),
            speaker: z.string().describe('Who says the line, e.g. "the pigeon". Empty for no line'),
            dialogue: z.string().describe("Speech bubble text: a few words, under 12. Empty for none"),
          }),
        )
        .describe("Exactly 4 panels; the last one has the punchline"),
    })
    .describe("A cute four-panel comic strip"),
});

export type Story = z.infer<typeof Story>;
export type Edition = z.infer<typeof Stories> & z.infer<typeof Extras>;

// Everything that goes into a printed edition. Saved with the edition, so tomorrow's paper can print the answers.
// Birthdays are names from the reader's Google Calendar; they never go to Claude.
export type Paper = Edition & { forecast: Forecast | null; puzzles: Puzzles; birthdays: string[] };

// Every section of stories in the paper. Weather and puzzles are made separately.
const storySections = (settings: Settings) => settings.pages.flatMap((p) => p.slots.filter((s) => !s.kind));

// The page plan: which section goes in each slot, and how many words fit there.
function pagePlan(settings: Settings) {
  const illustrated = illustratedSlot(settings.pages[0]);
  return settings.pages
    .map((page, i) => {
      const slots = page.slots.map((s, j) => {
        if (s.kind) return `  - Slot ${j + 1}: ${FEATURES[s.kind].title}. Made automatically: leave its stories empty.`;
        const words = slotWords(i, page.layout, j);
        const slot = LAYOUTS[page.layout].slots[j];
        const picture = ("picture" in slot && slot.picture) || 0;
        const size =
          i === 0 && j === illustrated
            ? `About ${words} words with the illustration, or ${words + picture} without it.`
            : `About ${words} words.`;
        return `  - Slot ${j + 1}: ${s.title} (${s.about}). ${size}`;
      });
      return `Page ${i + 1}${i === 0 ? " (front page, below the masthead)" : ""}:\n${slots.join("\n")}`;
    })
    .join("\n");
}

// Where the illustration may go, and what it may never show.
function pictureRule(settings: Settings) {
  const slot = illustratedSlot(settings.pages[0]);
  if (slot < 0) return "- This paper has no illustration: leave it empty.";
  return `- The illustration goes with one light or neutral story in front-page slot ${slot + 1} (${
    settings.pages[0].slots[slot].title
  }). Never illustrate violence, death, injury, war, disasters, crime or grief. If no story there suits, leave it empty and write the extra words instead. Put the illustrated story first in its slot.`;
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

// Step 1: research today's news with web search, one section at a time, all at once. Returns notes, not articles.
export async function research(settings: Settings, date: string) {
  const sections = storySections(settings);
  const results = await Promise.all(
    sections.map((s) =>
      ask(
        `Today is ${date}. You are researching one section of a personal newspaper for a reader in ${settings.location}.
Find the most important news from the last 24 hours for this section: ${s.title} (${s.about}).
${s.sources?.length ? `Prefer these sources: ${s.sources.join(", ")}.` : ""}
For every story, give the key facts and the source names and URLs. Write notes, not articles. Be quick: a few searches are enough.
${preferences(settings)}`,
        { label: `Research: ${s.title}`, search: true },
      ),
    ),
  );
  const notes = results.map((r, k) => `## ${sections[k].title}\n${r.text}`).join("\n\n");
  return { notes, usd: results.reduce((sum, r) => sum + r.usd, 0) };
}

// Step 2: write the edition from the notes. The stories and the extras are written at the same time.
export async function write(settings: Settings, date: string, notes: string, forecast: string) {
  const [stories, extras] = await Promise.all([
    ask(
      `You are the editor of "${settings.name}", a printed newspaper made for one reader in ${settings.location}.
Today is ${date}. Write today's stories from the research notes below.

The paper has ${settings.pages.length} pages. Each page is split into slots, and each slot holds one section:
${pagePlan(settings)}

Rules:
- Write in English. Tone: ${TONES[settings.tone].guide}. Reading level: ${READING_LEVELS[settings.readingLevel]}.
- News stories must only use facts from the notes, and must list their sources.
- Pieces you write yourself, such as editorials and analysis, must say so in their label (e.g. "Editorial").
- The word counts are limits: the paper is printed, and text that doesn't fit is cut off. Stay at or under them.
- A slot of under ${MAIN_STORY_WORDS} words holds one story. Bigger slots hold a main story and at most two shorter ones. Every extra story's headline takes space from the words.
- Don't tell the same story in two slots.
- Write like a good newspaper: clear, concrete and short paragraphs.
${pictureRule(settings)}
${preferences(settings)}

Research notes:
${notes}`,
      { label: "Writing the stories", schema: Stories },
    ),
    ask(
      `You make the extras for "${settings.name}", a printed newspaper for one reader in ${
        settings.location
      }. Today is ${date}.
From today's research notes below, write the weather tip, the puzzle words, the quiz, the word of the day and the comic.

Rules:
- Write in English. Tone: ${TONES[settings.tone].guide}.
- Puzzle words, quiz questions and answers must come from the notes, and the answers must be right.
- The comic strip stars ${
        settings.comicCast
      }, drawn the same every day. Make a gentle, non-partisan joke about a light story from today. Never joke about tragedies, and never show real people.

The forecast, for the weather tip:
${forecast || "Not available. Leave the weather tip empty."}

Research notes:
${notes}`,
      { label: "Writing the extras", schema: Extras, fast: true },
    ),
  ]);
  const edition: Edition = { ...Stories.parse(JSON.parse(stories.text)), ...Extras.parse(JSON.parse(extras.text)) };
  return { edition, usd: stories.usd + extras.usd };
}
