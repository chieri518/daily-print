import { z } from "zod";

// Choices readers make on the Customize page. Used by the page itself, the editor and the print layout.

// The fonts behind each typeface. All are free Google Fonts.
export const TYPEFACES = {
  classic: { label: "Classic", masthead: "UnifrakturMaguntia", headline: "Playfair Display", body: "Source Serif 4" },
  caslon: {
    label: "Caslon",
    masthead: "Libre Caslon Display",
    headline: "Libre Caslon Text",
    body: "Libre Caslon Text",
  },
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

export type Shape = "full" | "wide" | "tall" | "quarter" | "strip";

// Each page is a CSS grid of slots, filled in order (grid areas a, b, c, d). For each slot:
// - shape: decides which sections fit (see `fits`)
// - words, frontWords: about how many words fit on an inside page and on the front page (below the masthead, and next to
//   the illustration in the first slot), measured at 10pt with a 10% margin
// - columns: how many text columns its stories use
export const LAYOUTS = {
  single: {
    label: "One section",
    grid: `"a" 1fr / 1fr`,
    slots: [{ shape: "full", words: 690, frontWords: 400, columns: 3 }],
  },
  topTwo: {
    label: "Top + two below",
    grid: `"a a" 3fr "b c" 2fr / 1fr 1fr`,
    slots: [
      { shape: "wide", words: 280, frontWords: 170, columns: 3 },
      { shape: "quarter", words: 120, frontWords: 90, columns: 2 },
      { shape: "quarter", words: 120, frontWords: 90, columns: 2 },
    ],
  },
  halves: {
    label: "Two halves",
    grid: `"a" 1fr "b" 1fr / 1fr`,
    slots: [
      { shape: "wide", words: 220, frontWords: 100, columns: 3 },
      { shape: "wide", words: 220, frontWords: 220, columns: 3 },
    ],
  },
  columns: {
    label: "Two columns",
    grid: `"a b" 1fr / 1fr 1fr`,
    slots: [
      { shape: "tall", words: 320, frontWords: 220, columns: 2 },
      { shape: "tall", words: 320, frontWords: 260, columns: 2 },
    ],
  },
  quarters: {
    label: "Four quarters",
    grid: `"a b" 1fr "c d" 1fr / 1fr 1fr`,
    slots: [
      { shape: "quarter", words: 150, frontWords: 50, columns: 2 },
      { shape: "quarter", words: 150, frontWords: 120, columns: 2 },
      { shape: "quarter", words: 150, frontWords: 120, columns: 2 },
      { shape: "quarter", words: 150, frontWords: 120, columns: 2 },
    ],
  },
  stripMain: {
    label: "Weather strip + main",
    grid: `"a" auto "b" 1fr / 1fr`,
    slots: [
      { shape: "strip", words: 0, frontWords: 0, columns: 3 },
      { shape: "full", words: 480, frontWords: 220, columns: 3 },
    ],
  },
} satisfies Record<
  string,
  { label: string; grid: string; slots: { shape: Shape; words: number; frontWords: number; columns: number }[] }
>;

// Grid area name of a slot.
export const area = (slot: number) => "abcd"[slot];

// Slots with at least this many words hold a main story and shorter ones. Smaller slots hold one story.
export const MAIN_STORY_WORDS = 250;

export function slotWords(page: number, layout: keyof typeof LAYOUTS, slot: number) {
  const s = LAYOUTS[layout].slots[slot];
  return page === 0 ? s.frontWords : s.words;
}

// Sections that aren't stories. Each has a fixed design, so it needs a slot of the right shape.
// Puzzles stay inside the paper; only the weather can go on the front page.
export const FEATURES = {
  weather: {
    title: "Weather",
    about: "a five-day forecast, and whether to bring an umbrella or a jacket",
    shapes: ["strip", "wide", "full"],
    frontPage: true,
  },
  crossword: {
    title: "Mini Crossword",
    about: "a small crossword with clues from today's stories",
    shapes: ["wide", "tall", "full"],
    frontPage: false,
  },
  sudoku: { title: "Sudoku", about: "a sudoku puzzle", shapes: ["quarter", "wide", "tall", "full"], frontPage: false },
  wordSearch: {
    title: "Word Search",
    about: "words from today's stories hidden in a grid",
    shapes: ["quarter", "wide", "tall", "full"],
    frontPage: false,
  },
  trivia: {
    title: "News Quiz",
    about: "five questions about today's stories",
    shapes: ["quarter", "wide", "tall", "full"],
    frontPage: false,
  },
} satisfies Record<string, { title: string; about: string; shapes: Shape[]; frontPage: boolean }>;

// `guide` tells the editor how to write in that tone.
export const TONES = {
  straight: { label: "Straight news", guide: "straight news: neutral and factual" },
  conversational: { label: "Conversational", guide: "conversational: warm and plain, like explaining to a friend" },
  witty: { label: "Witty", guide: "witty: light and clever, with the odd joke" },
  genz: {
    label: "Gen Z",
    guide: "Gen Z: casual and playful, with some current slang and a bit of irony, but every fact stays accurate",
  },
};
export const READING_LEVELS = { simple: "Simple", general: "General", expert: "Expert" };

const choice = <T extends object>(options: T) => z.enum(Object.keys(options) as [keyof T & string]);
const text = (max: number) => z.string().trim().max(max);

export const Section = z.object({
  title: text(40).min(1),
  about: text(300).min(1),
  sources: z.array(text(100)).max(10).optional(), // preferred sources for this section
  kind: choice(FEATURES).optional(), // empty for a section of stories
});

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
  tone: choice(TONES),
  readingLevel: choice(READING_LEVELS),
  trustedSources: z.array(text(100)).max(30),
  blockedSources: z.array(text(100)).max(30),
  brief: text(2000),
});

export type Section = z.infer<typeof Section>;
export type Feature = keyof typeof FEATURES;
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
  { title: "Opinion", about: "an editorial written by the editor about a story in this edition" },
  { title: "On This Day", about: "a short history piece about something that happened on this date" },
  ...Object.entries(FEATURES).map(([kind, f]) => ({ title: f.title, about: f.about, kind: kind as Feature })),
];

// Whether a section can go in a slot of this shape on this page. Stories fit any slot but the weather strip.
export function fits(section: Section, page: number, shape: Shape) {
  if (!section.kind) return shape !== "strip";
  const feature = FEATURES[section.kind];
  return (feature.shapes as Shape[]).includes(shape) && (page > 0 || feature.frontPage);
}
