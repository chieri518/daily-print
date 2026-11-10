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

// Ready-made page layouts on a grid of 6 tracks, so a third of the page is 2 tracks and a half is 3. `areas` are CSS
// grid-template-areas: each letter is a spot, filled with the page's sections in order (a, b, c…). `rows` are the
// rows' relative heights. How big each spot is in print is worked out in space.ts.
export const LAYOUTS = {
  leadColumns: { label: "Lead + 3 columns", rows: [2, 3], areas: ["a a a a a a", "b b c c d d"] },
  leadRail: { label: "Lead + rail", rows: [1, 1, 1], areas: ["a a a a b b", "a a a a c c", "a a a a d d"] },
  threeColumns: { label: "Three columns", rows: [1], areas: ["a a b b c c"] },
  leadHalves: { label: "Lead + two halves", rows: [2, 3], areas: ["a a a a a a", "b b b c c c"] },
  columnsStrip: { label: "Columns + strip", rows: [3, 2], areas: ["a a b b c c", "d d d d d d"] },
  sixBoxes: { label: "Six small boxes", rows: [1, 1], areas: ["a a b b c c", "d d e e f f"] },
  featureRailStrip: {
    label: "Feature + rail + strip",
    rows: [3, 3, 4],
    areas: ["a a a a b b", "a a a a c c", "d d d d d d"],
  },
  twoColumnsStacked: { label: "Two columns, stacked", rows: [1, 1], areas: ["a a a b b b", "c c c d d d"] },
};
export type Layout = keyof typeof LAYOUTS;

// The number of spots in a layout.
export const spotCount = (layout: Layout) => new Set(LAYOUTS[layout].areas.join(" ").split(" ")).size;

// Spots wider than this (in inches) get the comic as a strip.
export const STRIP_WIDTH = 4;

// Sections with room for at least this many words hold a main story and shorter ones. Smaller ones hold one story.
export const MAIN_STORY_WORDS = 250;

// The comic's shape in a spot: a 3:1 strip when it's wide, four panels stacked (1:2) when it's tall enough, or 2 × 2.
export function comicShape({ width, height }: { width: number; height: number }) {
  if (width > STRIP_WIDTH) return "strip";
  return height >= 0.35 + 2 * width ? "tall" : "square";
}

// A height in inches for spots one third, a half, two thirds or all of the page wide.
const byWidth =
  ([third, half, twoThirds, full]: number[]) =>
  (width: number) =>
    width < 3 ? third : width < 4.5 ? half : width < 6 ? twoThirds : full;

// Sections that aren't stories. Each has a fixed design, so it only goes in a spot at least `height(width)` tall, in
// inches: measured in print with the Classic typeface, title and yesterday's answers included. Puzzles stay inside the
// paper; the weather, comic and word of the day can go on the front page.
export const FEATURES = {
  weather: {
    title: "Weather",
    about: "a five-day forecast, sunrise, sunset, moon and air quality, and whether to bring an umbrella or a jacket",
    height: byWidth([2.3, 2.7, 2.2, 2.1]),
    frontPage: true,
  },
  crossword: {
    title: "Mini Crossword",
    about: "a small crossword with clues from today's stories",
    height: byWidth([6.4, 5.2, 3.8, 3.4]),
    frontPage: false,
  },
  sudoku: { title: "Sudoku", about: "a sudoku puzzle", height: () => 4.3, frontPage: false },
  wordSearch: {
    title: "Word Search",
    about: "words from today's stories hidden in a grid",
    height: byWidth([3.4, 3.3, 3.1, 3.1]),
    frontPage: false,
  },
  trivia: {
    title: "News Quiz",
    about: "five questions about today's stories",
    height: byWidth([4.2, 3.3, 3.1, 2.2]),
    frontPage: false,
  },
  jumble: {
    title: "Jumble",
    about: "four scrambled words from today's stories",
    height: byWidth([3.1, 2, 2, 2]),
    frontPage: false,
  },
  comic: {
    title: "Comic Strip",
    about: "a cute four-panel comic about the day's news, starring your cast",
    // A strip in a wide spot, or 2 × 2 panels; the drawing may shrink a little to fit.
    height: (w: number) => 0.35 + 0.85 * (w > STRIP_WIDTH ? w / 3 : w),
    frontPage: true,
  },
  wordOfTheDay: {
    title: "Word of the Day",
    about: "an interesting word, what it means and how to use it",
    height: byWidth([1.6, 1.6, 1.2, 1.2]),
    frontPage: true,
  },
} satisfies Record<string, { title: string; about: string; height: (width: number) => number; frontPage: boolean }>;

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

// A page: its layout, and the section in each spot. An empty spot (null) is taken by a section next to it.
export const Page = z
  .object({ layout: choice(LAYOUTS), slots: z.array(Section.nullable()) })
  .refine((p) => p.slots.length === spotCount(p.layout), "Every spot needs a section or null")
  .refine((p) => p.slots.some(Boolean), "Every page needs a section");

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

// The hard terms a reader marked as known on the Paper page, in lower case. They are never explained again.
export async function knownWordsFor(db: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await db.from("known_words").select("word").eq("user_id", userId);
  if (error) throw error;
  return data.map((row) => row.word);
}

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

// Whether a section can go in a spot this size (in inches) on this page. Stories fit anywhere.
export function fits(section: Section, page: number, { width, height }: { width: number; height: number }) {
  if (!section.kind) return true;
  const feature = FEATURES[section.kind];
  return height >= feature.height(width) && (page > 0 || feature.frontPage);
}
