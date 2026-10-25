// How much space each section gets on a printed page, in inches, and so how many words its stories can have.
// Used by the editor (word limits), the print layout (column widths) and the Customize page (previews).
// These are estimates: text that's too long shrinks to fit, and fillers go in what's left (see render.ts).
import { FEATURES, PAPER_SIZES, type Draft, type Item, type LENGTHS, type Settings } from "./settings.ts";

const MARGIN = 0.5; // around the page
const FOOTER = 0.25;
const MASTHEAD = 1.3; // on the front page
const GAP = 0.14; // between sections, 1em at 10pt
const COLUMN_GAP = 0.21; // 1.5em
const WORDS_PER_SQUARE_INCH = 13; // of body text at 10pt, with a small margin
const STORY_OVERHEAD = 1.1; // inches of height for the section title, headline, deck and sources

// A story band's share of the page height, and how a column's height is shared between its stories.
export const BAND_SHARE: Record<keyof typeof LENGTHS, number> = { short: 0.25, medium: 0.4, long: 0.55 };
export const WEIGHT: Record<keyof typeof LENGTHS, number> = { short: 1, medium: 2, long: 3 };

const inches = (size: string) => parseFloat(size) / (size.endsWith("mm") ? 25.4 : 1);

// The width of a page's columns and of its band.
export function widths(page: Draft, paperSize: Settings["paperSize"]) {
  const width = inches(PAPER_SIZES[paperSize].width) - 2 * MARGIN;
  const column = (width - (page.columns - 1) * COLUMN_GAP) / page.columns;
  return { column, band: page.band && page.band.rail !== "none" ? width - column - COLUMN_GAP : width };
}

// The column that runs the full height beside the band, or -1.
const railColumn = (page: Draft) =>
  page.band?.rail === "left" ? 0 : page.band?.rail === "right" ? page.columns - 1 : -1;

// The height of the page's columns, below the masthead on the front page.
export const columnHeight = (front: boolean, paperSize: Settings["paperSize"]) =>
  inches(PAPER_SIZES[paperSize].height) - 2 * MARGIN - FOOTER - (front ? MASTHEAD : 0);

// Where the band and each column sit in the page's grid (CSS grid-column and grid-row values). The band is in row 1 at
// the top or row 2 at the bottom; the rail column spans both rows.
export function gridPlaces(page: Draft) {
  const rail = railColumn(page);
  const top = page.band?.at !== "bottom";
  const end = page.columns + 1;
  return {
    band: { column: rail === 0 ? `2 / ${end}` : `1 / ${rail > 0 ? page.columns : end}`, row: top ? "1" : "2" },
    column: (k: number) => ({ column: `${k + 1}`, row: !page.band ? "1" : k === rail ? "1 / 3" : top ? "2" : "1" }),
  };
}

const featureHeight = (item: Item, width: number) =>
  item.section.kind ? FEATURES[item.section.kind].height(width) : 0;

// The size of every section on a page, in the order of `pageItems`.
export function measure(page: Draft, front: boolean, paperSize: Settings["paperSize"]) {
  const { column, band: bandWidth } = widths(page, paperSize);
  const height = columnHeight(front, paperSize);
  const item = page.band?.item;
  const bandHeight = !page.band
    ? 0
    : item?.section.kind
    ? featureHeight(item, bandWidth)
    : height * BAND_SHARE[item?.length ?? "medium"];
  const rail = railColumn(page);

  const stacks = page.stacks.map((stack, k) => {
    const free = (page.band && k !== rail ? height - bandHeight - GAP : height) - (stack.length - 1) * GAP;
    const left = Math.max(0, free - stack.reduce((sum, s) => sum + featureHeight(s, column), 0));
    const weights = stack.reduce((sum, s) => sum + (s.section.kind ? 0 : WEIGHT[s.length]), 0);
    return stack.map((s) => ({
      width: column,
      height: s.section.kind ? featureHeight(s, column) : (left * WEIGHT[s.length]) / weights,
    }));
  });
  return [...(page.band ? [{ width: bandWidth, height: bandHeight }] : []), ...stacks.flat()];
}

// How many words fit in a section of stories this size, rounded to tens.
export const words = ({ width, height }: { width: number; height: number }) =>
  Math.max(0, Math.round(((height - STORY_OVERHEAD) * width * WORDS_PER_SQUARE_INCH) / 10) * 10);

// How many words the front-page illustration (3:1, the band's width) takes the place of.
export const pictureWords = (width: number) => Math.round((width * (width / 3) * WORDS_PER_SQUARE_INCH) / 10) * 10;
