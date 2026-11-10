import { z } from "zod";
import { ask } from "./claude.ts";
import { makePuzzles, type Puzzles } from "./puzzles.ts";
import { FEATURES, MAIN_STORY_WORDS, READING_LEVELS, TONES, type Section, type Settings } from "./settings.ts";
import { illustratedSpot, measure, pictureWords, words } from "./space.ts";
import type { Forecast } from "./weather.ts";

const Story = z.object({
  label: z.string().describe('Small tag above the headline, e.g. "Editorial" or "On This Day". Empty for plain news.'),
  headline: z.string(),
  deck: z.string().describe("One-sentence subheadline"),
  paragraphs: z.array(z.string()),
  sources: z.array(z.object({ name: z.string(), url: z.string() })),
  terms: z
    .array(
      z.object({
        term: z.string().describe("Exactly as written in the story"),
        definition: z.string().describe("A short, plain definition, under 15 words"),
      }),
    )
    .describe("Hard words and acronyms in the story that this reader may not know, explained on the Paper page"),
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
    .array(z.object({ sections: z.array(z.object({ stories: z.array(Story) })) }))
    .describe("Every page and section from the plan, in the same order"),
});

// The small extras, written alongside the stories by a faster model: the weather tip, puzzles, quiz, word, comic and
// fillers.
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
  fillers: z
    .object({
      quote: z.object({ text: z.string(), by: z.string() }).describe("A short quote, ideally said in today's news"),
      funFact: z.string().describe("One surprising fact in a sentence, linked to a story when possible"),
      onThisDay: z
        .string()
        .describe("One sentence about something that happened on today's date in history, with the year"),
    })
    .describe("Small items printed where a section has space left"),
});

export type Story = z.infer<typeof Story>;
export type Edition = z.infer<typeof Stories> & z.infer<typeof Extras>;

// Everything that goes into a printed edition. Saved with the edition, so tomorrow's paper can print the answers.
// Birthdays are names from the reader's Google Calendar; they never go to Claude.
export type Paper = Edition & { forecast: Forecast | null; puzzles: Puzzles; birthdays: string[] };

// Puts the paper together: what Claude wrote, plus the forecast, the puzzles made by code (seeded, so making the same
// edition again gives the same puzzles) and today's birthdays.
export function assemble(edition: Edition, forecast: Forecast | null, seed: string, birthdays: string[]): Paper {
  return { ...edition, forecast, puzzles: makePuzzles(seed, edition), birthdays };
}

// Every section of stories in the paper. Weather and puzzles are made separately.
const storySections = (settings: Settings) =>
  settings.pages.flatMap((p) => p.slots).filter((s): s is Section => !!s && !s.kind);

// The page plan: every section in order, and how many words fit in its spot. Empty spots are left out.
function pagePlan(settings: Settings) {
  const illustrated = illustratedSpot(settings);
  return settings.pages
    .map((page, i) => {
      const space = measure(page, i === 0, settings.paperSize);
      const lines = page.slots.flatMap((s, j) => {
        if (!s) return [];
        if (s.kind) return [`${FEATURES[s.kind].title}. Made automatically: leave its stories empty.`];
        const fit = words(space[j]!);
        const size =
          i === 0 && j === illustrated
            ? `About ${fit - pictureWords(space[j]!.width)} words with the illustration, or ${fit} without it.`
            : `About ${fit} words.`;
        return [`${s.title} (${s.about}). ${size}`];
      });
      const list = lines.map((line, k) => `  - Section ${k + 1}: ${line}`).join("\n");
      return `Page ${i + 1}${i === 0 ? " (front page, below the masthead)" : ""}:\n${list}`;
    })
    .join("\n");
}

// Where the illustration may go, and what it may never show.
function pictureRule(settings: Settings) {
  const spot = illustratedSpot(settings);
  if (spot < 0) return "- This paper has no illustration: leave it empty.";
  return `- The illustration goes with one light or neutral story in the front page's ${
    settings.pages[0].slots[spot]!.title
  } section. Never illustrate violence, death, injury, war, disasters, crime or grief. If no story there suits, leave it empty and write the extra words instead. Put the illustrated story first in its section.`;
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

// Step 1: research today's news with web search: one Claude call per section, in parallel. Returns notes, not articles.
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
// `known` are the hard terms the reader already knows.
export async function write(settings: Settings, date: string, notes: string, forecast: string, known: string[]) {
  const [stories, extras] = await Promise.all([
    ask(
      `You are the editor of "${settings.name}", a printed newspaper made for one reader in ${settings.location}.
Today is ${date}. Write today's stories from the research notes below.

The paper has ${settings.pages.length} pages. Each page is split into sections:
${pagePlan(settings)}

Rules:
- Write in English. Tone: ${TONES[settings.tone].guide}. Reading level: ${READING_LEVELS[settings.readingLevel]}.
- News stories must only use facts from the notes, and must list their sources.
- Pieces you write yourself, such as editorials and analysis, must say so in their label (e.g. "Editorial").
- The word counts are limits: the paper is printed, and text that doesn't fit is cut off. Stay at or under them.
- A section of under ${MAIN_STORY_WORDS} words holds one story. Bigger sections hold a main story and at most two shorter ones. Every extra story's headline takes space from the words.
- Don't tell the same story in two sections.
- Write like a good newspaper: clear, concrete and short paragraphs.
- In each story's terms, list the hard words and acronyms a reader at this reading level may not know, with what they mean in the story. Leave out words and acronyms most readers know (e.g. "TV", "NASA"). Often there are none.${
        known.length ? `\n- This reader already knows these, so never list them as terms: ${known.join(", ")}.` : ""
      }
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
From today's research notes below, write the weather tip, the puzzle words, the quiz, the word of the day, the comic and the fillers.

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
