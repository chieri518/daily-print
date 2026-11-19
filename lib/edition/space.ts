// How big each spot of a page's layout is in print, in inches, and so how many words its stories can have.
// Used by the editor (word limits), the print layout and the Customize page (previews, and what fits where).
// Word counts are estimates: text that's too long shrinks to fit, and fillers go in what's left (see render.ts).
import { LAYOUTS, PAPER_SIZES, type Page, type Settings } from "../settings.ts";

const MARGIN = 0.5; // around the page
const FOOTER = 0.25;
const MASTHEAD = 1.3; // on the front page
const ROW_GAP = 0.14; // 1em at 10pt
const COLUMN_GAP = 0.21; // 1.5em
const TRACKS = 6; // the layouts' grid; see LAYOUTS
const WORDS_PER_SQUARE_INCH = 13; // of body text at 10pt, with a small margin
const STORY_OVERHEAD = 1.1; // inches of height for the section title, headline, deck and sources

export type Size = { width: number; height: number };
// A page, or one being edited, whose spots may be empty.
type Spots = Pick<Page, "layout"> & { slots: unknown[] };

const inches = (size: string) => parseFloat(size) / (size.endsWith("mm") ? 25.4 : 1);
export const spotLetter = (slot: number) => String.fromCharCode(97 + slot); // spot 0 is "a"
export const spotIndex = (letter: string) => letter.charCodeAt(0) - 97;

// A grid of spot letters as CSS grid-template-areas, from rows like "a a b" or ["a", "a", "b"].
export const gridAreas = (rows: (string | string[])[]) =>
  rows.map((row) => `"${typeof row === "string" ? row : row.join(" ")}"`).join(" ");

// The [row, track] cells of a spot in a grid of spot letters.
const cells = (grid: string[][], spot: string) =>
  grid.flatMap((row, r) => row.flatMap((x, c) => (x === spot ? [[r, c]] : [])));

// The layout's grid of spot letters, row by row, after each empty spot is taken over by a section next to it: above,
// to the left, below or to the right, the first that keeps both together a rectangle. Otherwise it stays empty.
export function filledAreas(page: Spots) {
  const grid = LAYOUTS[page.layout].areas.map((row) => row.split(" "));
  const isRectangle = (all: number[][]) => {
    const rows = all.map(([r]) => r);
    const cols = all.map(([, c]) => c);
    return all.length === (Math.max(...rows) - Math.min(...rows) + 1) * (Math.max(...cols) - Math.min(...cols) + 1);
  };
  page.slots.forEach((section, slot) => {
    if (section) return;
    const empty = spotLetter(slot);
    const own = cells(grid, empty);
    const [[top, left]] = own;
    const [[bottom, right]] = own.slice(-1);
    const neighbours = [grid[top - 1]?.[left], grid[top][left - 1], grid[bottom + 1]?.[left], grid[top][right + 1]];
    const taker = neighbours.find((n) => n && page.slots[spotIndex(n)] && isRectangle([...own, ...cells(grid, n)]));
    if (taker) for (const [r, c] of own) grid[r][c] = taker;
  });
  return grid;
}

// The size of each spot on a page, by slot; null for a spot taken over by a neighbour.
export function measure(page: Spots, front: boolean, paperSize: Settings["paperSize"]) {
  const { rows } = LAYOUTS[page.layout];
  const grid = filledAreas(page);
  const width = inches(PAPER_SIZES[paperSize].width) - 2 * MARGIN;
  const height = inches(PAPER_SIZES[paperSize].height) - 2 * MARGIN - FOOTER - (front ? MASTHEAD : 0);
  const track = (width - (TRACKS - 1) * COLUMN_GAP) / TRACKS;
  const fr = (height - (rows.length - 1) * ROW_GAP) / rows.reduce((a, b) => a + b, 0);
  return page.slots.map((_, slot): Size | null => {
    const at = cells(grid, spotLetter(slot));
    if (!at.length) return null;
    const spanRows = [...new Set(at.map(([r]) => r))];
    const spanTracks = new Set(at.map(([, c]) => c)).size;
    return {
      width: spanTracks * track + (spanTracks - 1) * COLUMN_GAP,
      height: spanRows.reduce((sum, r) => sum + rows[r] * fr, 0) + (spanRows.length - 1) * ROW_GAP,
    };
  });
}

// How many words fit in a spot of stories this size, rounded to tens.
export const words = ({ width, height }: Size) =>
  Math.max(0, Math.round(((height - STORY_OVERHEAD) * width * WORDS_PER_SQUARE_INCH) / 10) * 10);

// How many words the front-page illustration (3:1, the spot's width) takes the place of.
export const pictureWords = (width: number) => Math.round((width * (width / 3) * WORDS_PER_SQUARE_INCH) / 10) * 10;

// How many text columns a story uses in a spot this wide: about one per 2.3 inches.
export const textColumns = (width: number) => Math.max(1, Math.floor(width / 2.3));

// The front page's illustrated spot: the first spot of stories at least two columns of the page (4 tracks) wide, or -1
// for none.
export function illustratedSpot(settings: Settings) {
  const page = settings.pages[0];
  const grid = filledAreas(page);
  const tracks = (slot: number) => new Set(cells(grid, spotLetter(slot)).map(([, c]) => c)).size;
  return page.slots.findIndex((s, j) => s && !s.kind && tracks(j) >= 4);
}
