import { z } from "zod";

// Choices readers make on the Customize page. Used by the page itself, the editor and the print layout.

// The fonts behind each typeface. All are free Google Fonts.
export const TYPEFACES = {
  classic: { label: "Classic", masthead: "UnifrakturMaguntia", headline: "Playfair Display", body: "Source Serif 4" },
  caslon: { label: "Caslon", masthead: "Libre Caslon Display", headline: "Libre Caslon Text", body: "Libre Caslon Text" },
  bodoni: { label: "Bodoni", masthead: "Bodoni Moda", headline: "Bodoni Moda", body: "Newsreader" },
};

// Loads each font once, with the weights its role needs (later roles win if a font is reused).
export function fontsUrl(fonts: { masthead: string; headline: string; body: string }) {
  const axes = { [fonts.masthead]: "", [fonts.headline]: ":wght@700" };
  axes[fonts.body] = ":ital,wght@0,400;0,700;1,400";
  const families = Object.entries(axes).map(([name, axis]) => `family=${name.replaceAll(" ", "+")}${axis}`);
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=block`;
}

export const PAPER_SIZES = {
  letter: { label: "US Letter", width: "8.5in", height: "11in" },
  a4: { label: "A4", width: "210mm", height: "297mm" },
};

// Each page is a CSS grid of slots, filled in order. `words` is how much text fits in a slot on an inside page,
// and `columns` is how many text columns its stories use.
export const LAYOUTS = {
  single: { label: "One section", grid: `"a" 1fr / 1fr`, slots: [{ words: 650, columns: 3 }] },
  topTwo: {
    label: "Top + two below",
    grid: `"a a" 3fr "b c" 2fr / 1fr 1fr`,
    slots: [{ words: 380, columns: 3 }, { words: 130, columns: 2 }, { words: 130, columns: 2 }],
  },
  halves: { label: "Two halves", grid: `"a" 1fr "b" 1fr / 1fr`, slots: [{ words: 320, columns: 3 }, { words: 320, columns: 3 }] },
  columns: { label: "Two columns", grid: `"a b" 1fr / 1fr 1fr`, slots: [{ words: 320, columns: 2 }, { words: 320, columns: 2 }] },
};

// The masthead takes about a third of the front page.
export const FRONT_PAGE_SPACE = 0.65;

export const TONES = { straight: "Straight news", conversational: "Conversational", witty: "Witty" };
export const READING_LEVELS = { simple: "Simple", general: "General", expert: "Expert" };

const choice = <T extends object>(options: T) => z.enum(Object.keys(options) as [keyof T & string]);
const text = (max: number) => z.string().trim().max(max);

export const Section = z.object({ title: text(40).min(1), about: text(300).min(1) });

export const Page = z
  .object({ layout: choice(LAYOUTS), slots: z.array(Section) })
  .refine((p) => p.slots.length === LAYOUTS[p.layout].slots.length, "Every slot needs a section");

export const MAX_PAGES = 8;

export const Settings = z.object({
  name: text(60).min(1),
  typeface: choice(TYPEFACES),
  paperSize: choice(PAPER_SIZES),
  location: text(100).min(1),
  pages: z.array(Page).min(1).max(MAX_PAGES), // the first is the front page
  customSections: z.array(Section).max(30),
  language: text(40).min(1),
  tone: choice(TONES),
  readingLevel: choice(READING_LEVELS),
  trustedSources: z.array(text(100)).max(30),
  blockedSources: z.array(text(100)).max(30),
  brief: text(2000),
});

export type Section = z.infer<typeof Section>;
export type Page = z.infer<typeof Page>;
export type Settings = z.infer<typeof Settings>;

// Ready-made sections. Readers can also make their own.
export const PRESET_SECTIONS: Section[] = [
  { title: "Top Stories", about: "the most important stories of the day, from any topic" },
  { title: "Local News", about: "news from the reader's city and region" },
  { title: "World", about: "major international news" },
  { title: "Business", about: "markets, companies and the economy" },
  { title: "Tech", about: "startups, venture funding, AI and big tech" },
  { title: "Science", about: "science, health and the environment" },
  { title: "Sports", about: "results and the big sports stories" },
  { title: "Culture", about: "arts, books, film and music" },
  { title: "Weather", about: "a detailed forecast for the reader's area for today and the next few days" },
  { title: "Opinion", about: "an editorial written by the editor about a story in this edition" },
  { title: "On This Day", about: "a short history piece about something that happened on this date" },
];

const preset = (title: string) => PRESET_SECTIONS.find((s) => s.title === title)!;
const page = (layout: keyof typeof LAYOUTS, ...titles: string[]): Page => ({ layout, slots: titles.map(preset) });

// Starting points on the Customize page. Picking one replaces the reader's pages.
export const TEMPLATES = {
  general: {
    label: "General",
    pages: [
      page("topTwo", "Top Stories", "Weather", "On This Day"),
      page("halves", "World", "Business"),
      page("topTwo", "Science", "Sports", "Culture"),
      page("columns", "Opinion", "Tech"),
    ],
  },
  local: {
    label: "Local",
    pages: [
      page("topTwo", "Local News", "Weather", "On This Day"),
      page("single", "Top Stories"),
      page("columns", "Sports", "Culture"),
      page("topTwo", "Opinion", "Business", "Science"),
    ],
  },
  tech: {
    label: "Tech digest",
    pages: [
      page("topTwo", "Top Stories", "Weather", "Opinion"),
      page("single", "Tech"),
      page("halves", "Business", "Science"),
      page("columns", "World", "On This Day"),
    ],
  },
};
