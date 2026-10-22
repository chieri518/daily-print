import { z } from "zod";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { ask } from "./claude.ts";

export type Settings = {
  name: string;
  typeface: string;
  location: string;
  sections: { title: string; about: string }[];
};

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

export type Story = z.infer<typeof Story>;
export type Edition = z.infer<typeof Edition>;

// The last page is always written by the agent itself.
const OPINION = {
  title: "Opinion & Features",
  about:
    'an editorial (label "Editorial") and an analysis that connects stories from this edition (label "Analysis"), ' +
    'both written by you, plus a short "On This Day" history piece',
};

export async function writeEdition(settings: Settings, date: string): Promise<Edition> {
  const sections = [...settings.sections, OPINION];
  const sectionList = sections.map((s) => `- ${s.title}: ${s.about}`).join("\n");

  // Step 1: research today's news with web search.
  const research = await ask(
    `Today is ${date}. You are researching a personal newspaper for a reader in ${settings.location}.
Find the most important news from the last 24 hours for each section:
${sectionList}

Also find today's weather forecast for ${settings.location}.
For every story, give the key facts and the source names and URLs. Write notes, not articles.`,
    {
      tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 12 }],
      output_config: { effort: "medium" },
    },
  );
  const notes = research.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");

  // Step 2: edit and write the edition from the notes.
  const edition = await ask(
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
    { output_config: { effort: "medium", format: betaZodOutputFormat(Edition) } },
  );
  if (!edition.parsed_output) throw new Error("Claude's edition didn't match the expected format.");
  return edition.parsed_output;
}
