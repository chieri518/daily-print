import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import defaults from "../paper.json" with { type: "json" };

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

// Wind speed follows the temperature: mph with Fahrenheit, km/h with Celsius.
export const TEMPERATURES = { fahrenheit: "°F (Fahrenheit)", celsius: "°C (Celsius)" };

// A page is 1 to 3 columns of up to 3 sections, stacked top to bottom, with an optional band for wide items at the top or
// bottom. The band covers every column, or all but the first or last (the "rail", which then runs the full height).
// How much space each section gets is worked out in space.ts.
export const LENGTHS = { short: "Short", medium: "Medium", long: "Long" }; // only stories have a length

// Sections with room for at least this many words hold a main story and shorter ones. Smaller ones hold one story.
export const MAIN_STORY_WORDS = 250;

// Whether the front page's band holds stories. The illustration goes there; without one, no illustration is made.
export const illustrated = (settings: Settings) => !!settings.pages[0].band && !settings.pages[0].band.item.section.kind;

// Every section on a page, in order: the band first, then each column top to bottom.
export const pageItems = (page: Draft) => [...(page.band?.item ? [page.band.item] : []), ...page.stacks.flat()];

// The comic is a strip in a wide space (wider than this, in inches), or four panels stacked in a column.
export const STRIP_WIDTH = 4;

// Sections that aren't stories. Each has a fixed design, so it needs a minimum width, and takes about `height` inches
// at a given width (in inches, used to size the stories around it). Puzzles stay inside the paper; the weather, comic
// and word of the day can go on the front page.
export const FEATURES = {
  weather: {
    title: "Weather",
    about: "a five-day forecast, sunrise, sunset, moon and air quality, and whether to bring an umbrella or a jacket",
    minWidth: 3.5,
    height: () => 1.9,
    frontPage: true,
  },
  crossword: {
    title: "Mini Crossword",
    about: "a small crossword with clues from today's stories",
    minWidth: 2.2,
    height: (w: number) => (w > STRIP_WIDTH ? 3.4 : 4.9), // the clues go beside the grid, or below it
    frontPage: false,
  },
  sudoku: { title: "Sudoku", about: "a sudoku puzzle", minWidth: 2.2, height: () => 4, frontPage: false },
  wordSearch: {
    title: "Word Search",
    about: "words from today's stories hidden in a grid",
    minWidth: 2.2,
    height: () => 3,
    frontPage: false,
  },
  trivia: {
    title: "News Quiz",
    about: "five questions about today's stories",
    minWidth: 1.5,
    height: (w: number) => (w < 3 ? 3.4 : 2.6),
    frontPage: false,
  },
  jumble: {
    title: "Jumble",
    about: "four scrambled words from today's stories",
    minWidth: 1.6,
    height: (w: number) => (w < 3 ? 3.3 : 2.4),
    frontPage: false,
  },
  comic: {
    title: "Comic Strip",
    about: "a cute four-panel comic about the day's news, starring your cast",
    minWidth: 1.5,
    height: (w: number) => 0.35 + (w > STRIP_WIDTH ? w / 3 : w * 2), // a 3:1 strip, or panels stacked 1:2
    frontPage: true,
  },
  wordOfTheDay: {
    title: "Word of the Day",
    about: "an interesting word, what it means and how to use it",
    minWidth: 1.5,
    height: (w: number) => (w < 3 ? 1.6 : 1.2),
    frontPage: true,
  },
} satisfies Record<
  string,
  { title: string; about: string; minWidth: number; height: (width: number) => number; frontPage: boolean }
>;


export const DEFAULT_CAST = "a skeptical gray cat and an over-excited pigeon";

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

export const MAX_COLUMNS = 3;
export const MAX_STACK = 3; // sections in one column

const Item = z.object({ section: Section, length: choice(LENGTHS).default("medium") });

export const Page = z
  .object({
    columns: z.number().int().min(1).max(MAX_COLUMNS),
    band: z.object({ item: Item, at: z.enum(["top", "bottom"]), rail: z.enum(["none", "left", "right"]) }).nullable(),
    stacks: z.array(z.array(Item).min(1, "Every column needs a section").max(MAX_STACK)),
  })
  .refine((p) => p.stacks.length === p.columns, "Every column needs a section");

export const MAX_PAGES = 8;

export const Settings = z.object({
  name: text(60).min(1),
  typeface: choice(TYPEFACES),
  paperSize: choice(PAPER_SIZES),
  temperature: choice(TEMPERATURES).default("fahrenheit"), // settings saved before this choice get °F
  comicCast: text(200).min(1).default(DEFAULT_CAST), // who stars in the comic strip, every day
  printTime: z
    .string()
    .regex(/^(\d\d:\d\d)?$/)
    .default(""), // when the printer box prints the paper each morning, e.g. "06:30"; empty for no automatic paper
  timeZone: z.string().default("America/Los_Angeles"), // the reader's, taken from their browser when they save
  location: text(100).min(1),
  pages: z.array(Page).min(1).max(MAX_PAGES), // the first is the front page
  customSections: z.array(Section).max(30),
  tone: choice(TONES),
  readingLevel: choice(READING_LEVELS),
  trustedSources: z.array(text(100)).max(30),
  blockedSources: z.array(text(100)).max(30),
  brief: text(2000),
});

// A reader's saved settings, or the defaults from paper.json if they have none. Pages saved in an older format are
// replaced with the default pages, keeping the rest.
export function settingsOrDefaults(saved: unknown): Settings {
  const parsed = Settings.safeParse(saved);
  if (parsed.success) return parsed.data;
  const withDefaultPages = Settings.safeParse({ ...(saved as object), pages: defaults.pages });
  return withDefaultPages.success ? withDefaultPages.data : Settings.parse(defaults);
}

// A reader's saved settings, read with a Supabase client that's allowed to see them.
export async function settingsFor(db: SupabaseClient, userId: string) {
  const { data, error } = await db.from("papers").select("settings").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return settingsOrDefaults(data?.settings);
}

export type Section = z.infer<typeof Section>;
export type Feature = keyof typeof FEATURES;
export type Item = z.infer<typeof Item>;
export type Page = z.infer<typeof Page>;
// A page while it's being edited in Customize: a column can be empty, and the band can have no section yet.
export type Draft = Omit<Page, "band"> & {
  band: (Omit<NonNullable<Page["band"]>, "item"> & { item: Item | null }) | null;
};
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

// Whether a section can go in a space this many inches wide on this page. Stories fit anywhere.
export function fits(section: Section, page: number, width: number) {
  if (!section.kind) return true;
  const feature = FEATURES[section.kind];
  return width >= feature.minWidth && (page > 0 || feature.frontPage);
}
