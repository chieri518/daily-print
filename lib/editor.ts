import { z } from "zod";
import { ask } from "./claude.ts";

// A reader's paper. The 4-page paper has room for two sections of their choice (pages 2 and 3).
export const Settings = z.object({
  name: z.string().trim().min(1).max(60),
  typeface: z.enum(["classic", "caslon", "bodoni"]),
  location: z.string().trim().min(1).max(100),
  sections: z.array(z.object({ title: z.string().trim().min(1).max(40), about: z.string().trim().min(1).max(200) })).length(2),
});

const Story = z.object({
  label: z.string().describe('Small tag above the headline, e.g. "Editorial" or "On This Day". Empty for plain news.'),
  headline: z.string(),
  deck: z.string().describe("One-sentence subheadline"),
  paragraphs: z.array(z.string()),
  sources: z.array(z.object({ name: z.string(), url: z.string() })),
});

const Edition = z.object({
  weather: z.string().describe('Short forecast for the reader\'s location, e.g. "Sunny, 68°F / 54°F"'),
  illustration: z.string().describe("Description of a black-and-white illustration for the lead story"),
  frontPage: z.array(Story).describe("The lead story first, then two shorter stories"),
  pages: z.array(z.object({ title: z.string(), stories: z.array(Story) })),
});

export type Settings = z.infer<typeof Settings>;
export type Story = z.infer<typeof Story>;
export type Edition = z.infer<typeof Edition>;

// The last page is always written by the agent itself.
const OPINION = {
  title: "Opinion & Features",
  about:
    'an editorial (label "Editorial") and an analysis that connects stories from this edition (label "Analysis"), ' +
    'both written by you, plus a short "On This Day" history piece',
};

// Step 1: research today's news with web search. Returns notes, not articles.
export async function research(settings: Settings, date: string) {
  const sectionList = [...settings.sections, OPINION].map((s) => `- ${s.title}: ${s.about}`).join("\n");
  const { text: notes, usd } = await ask(
    `Today is ${date}. You are researching a personal newspaper for a reader in ${settings.location}.
Find the most important news from the last 24 hours for each section:
${sectionList}

Also find today's weather forecast for ${settings.location}.
For every story, give the key facts and the source names and URLs. Write notes, not articles.`,
    { search: true },
  );
  return { notes, usd };
}

// Step 2: edit and write the edition from the notes.
export async function write(settings: Settings, date: string, notes: string) {
  const sections = [...settings.sections, OPINION];
  const { text, usd } = await ask(
    `You are the editor of "${settings.name}", a printed newspaper made for one reader in ${settings.location}.
Today is ${date}. Write today's edition from the research notes below.

The paper has 4 pages:
1. Front page: the lead story (about 220 words) and two shorter stories (about 120 words each), chosen from any section.
${sections.map((s, i) => `${i + 2}. ${s.title}: ${s.about}. About 650 words in total, across 2-4 stories.`).join("\n")}

Rules:
- News stories must only use facts from the notes, and must list their sources.
- Don't repeat a front-page story inside the paper.
- Write like a good newspaper: clear, concrete and short paragraphs.

Research notes:
${notes}`,
    { schema: Edition },
  );
  return { edition: Edition.parse(JSON.parse(text)), usd };
}
