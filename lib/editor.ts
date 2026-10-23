import { z } from "zod";
import { ask } from "./claude.ts";
import { FRONT_PAGE_SPACE, LAYOUTS, READING_LEVELS, TONES, type Settings } from "./settings.ts";

const Story = z.object({
  label: z.string().describe('Small tag above the headline, e.g. "Editorial" or "On This Day". Empty for plain news.'),
  headline: z.string(),
  deck: z.string().describe("One-sentence subheadline"),
  paragraphs: z.array(z.string()),
  sources: z.array(z.object({ name: z.string(), url: z.string() })),
});

const Edition = z.object({
  weather: z.string().describe('Short forecast for the reader\'s location, e.g. "Sunny, 68°F / 54°F"'),
  illustration: z.string().describe("Description of a black-and-white illustration for the first story on the front page"),
  pages: z
    .array(z.object({ slots: z.array(z.object({ stories: z.array(Story) })) }))
    .describe("Every page and slot from the plan, in the same order"),
});

export type Story = z.infer<typeof Story>;
export type Edition = z.infer<typeof Edition>;

// Every section in the paper.
function sectionList(settings: Settings) {
  return settings.pages.flatMap((p) => p.slots.map((s) => `- ${s.title}: ${s.about}`)).join("\n");
}

// The page plan: which section goes in each slot, and how many words fit there.
function pagePlan(settings: Settings) {
  return settings.pages
    .map((page, i) => {
      const space = i === 0 ? FRONT_PAGE_SPACE : 1;
      const slots = page.slots.map((s, j) => {
        const illustration = i === 0 && j === 0 ? 150 : 0; // the illustration takes the place of about 150 words
        const words = Math.round((LAYOUTS[page.layout].slots[j].words * space - illustration) / 10) * 10;
        return `  - Slot ${j + 1}: ${s.title} (${s.about}). About ${words} words.`;
      });
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

Also find today's weather forecast for ${settings.location}.
For every story, give the key facts and the source names and URLs. Write notes, not articles.
${preferences(settings)}`,
    { search: true },
  );
  return { notes, usd };
}

// Step 2: edit and write the edition from the notes.
export async function write(settings: Settings, date: string, notes: string) {
  const { text, usd } = await ask(
    `You are the editor of "${settings.name}", a printed newspaper made for one reader in ${settings.location}.
Today is ${date}. Write today's edition from the research notes below.

The paper has ${settings.pages.length} pages. Each page is split into slots, and each slot holds one section:
${pagePlan(settings)}

Rules:
- Write in ${settings.language}. Tone: ${TONES[settings.tone]}. Reading level: ${READING_LEVELS[settings.readingLevel]}.
- News stories must only use facts from the notes, and must list their sources.
- Pieces you write yourself, such as editorials and analysis, must say so in their label (e.g. "Editorial").
- A slot of under 250 words holds one story. Bigger slots hold a main story and one or two shorter ones.
- Don't tell the same story in two slots.
- Write like a good newspaper: clear, concrete and short paragraphs.
${preferences(settings)}

Research notes:
${notes}`,
    { schema: Edition },
  );
  return { edition: Edition.parse(JSON.parse(text)), usd };
}
