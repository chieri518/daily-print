import chromium from "@sparticuz/chromium";
import { chromium as playwright, type Page } from "playwright-core";
import { createElement } from "react";
import type { Paper } from "../edition/editor.ts";
import { Newspaper, type Fit, type Layout } from "./newspaper.tsx";
import { css } from "./css.ts";
import { fontsUrl, PAPER_SIZES, TYPEFACES } from "../settings.ts";

// Prints the paper to a PDF. First it draws the pages and measures how they fit: the text in each section shrinks until
// it fits, then timelines, pull quotes and fillers go where there's room. Then it prints the pages drawn with that fit,
// which is saved with the edition so the Paper page draws exactly the same pages. Also returns the pages with a section
// whose text still doesn't fit.
// On Vercel it uses a Chromium build made for serverless functions; locally, the one from `npx playwright-core install chromium`.
export function renderPdf(paper: Paper, layout: Layout) {
  return inChromium(async (page) => {
    await show(page, paper, { ...layout, fit: null });
    const { fit, overflowing } = await page.evaluate(measureFit);
    await show(page, paper, { ...layout, fit });
    const pdf = await page.pdf({ preferCSSPageSize: true });
    return { pdf, fit, overflowing };
  });
}

// Only measures how the paper fits, without printing it.
export function measureLayout(paper: Paper, layout: Layout) {
  return inChromium(async (page) => {
    await show(page, paper, { ...layout, fit: null });
    return page.evaluate(measureFit);
  });
}

async function inChromium<T>(work: (page: Page) => Promise<T>) {
  const browser = await playwright.launch(
    process.env.VERCEL ? { executablePath: await chromium.executablePath(), args: chromium.args } : {},
  );
  try {
    return await work(await browser.newPage());
  } finally {
    await browser.close();
  }
}

// Loads the paper as a page of its own, with its fonts, stylesheet and paper size.
// react-dom/server is imported here rather than at the top: Next refuses a static import of it in a route's code, and
// the edition workflow runs as a route.
async function show(page: Page, paper: Paper, layout: Layout) {
  const { renderToStaticMarkup } = await import("react-dom/server");
  const size = PAPER_SIZES[layout.settings.paperSize];
  await page.setContent(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <link rel="stylesheet" href="${fontsUrl(TYPEFACES[layout.settings.typeface])}">
  <style>${css}</style>
  <style>@page { size: ${size.width} ${size.height}; margin: 0; } body { margin: 0; }</style>
</head>
<body>${renderToStaticMarkup(createElement(Newspaper, { paper, layout }))}</body>
</html>`,
    { waitUntil: "networkidle" },
  );
}

// Runs in the browser. Shrinks the text in each section that's too long until it fits, with no timelines, pull quotes
// or fillers: one long section doesn't shrink the others. Then fills the space left, most useful first, keeping each
// where its section still fits:
// 1. each story's timeline, lead stories first, since it helps the reader understand the story;
// 2. a pull quote, at most one per section, since more looks like padding;
// 3. the fillers (quote of the day, fun fact, on this day), each in the section of stories with the most room left,
//    or else in a puzzle's or the weather's.
// Finally it notes the empty height left in each section. The comic shrinks to fit its spot, so it's fixed at its size
// first: otherwise a filler would squeeze it instead of overflowing.
// No named functions inside: `npm run paper` runs through tsx, which wraps them in a helper the browser doesn't have.
async function measureFit(): Promise<{ fit: Fit; overflowing: number[] }> {
  await document.fonts.ready;
  const sections = [...document.querySelectorAll<HTMLElement>(".page .section")];
  const fontSizes: Record<string, number> = {};
  const overflowing = new Set<number>();
  sections.forEach((section) => {
    let size = 10;
    while (size > 7.5 && section.scrollHeight > section.clientHeight) section.style.fontSize = `${(size -= 0.25)}pt`;
    if (size < 10) fontSizes[section.dataset.spot!] = size;
    if (section.scrollHeight > section.clientHeight) overflowing.add(Number(section.dataset.spot!.split(".")[0]) + 1);
  });

  const comic = document.querySelector<HTMLElement>(".comic");
  const comicHeight = comic?.offsetHeight ?? null;
  if (comic) comic.style.flex = `0 0 ${comicHeight}px`;

  const quoted = new Set<Element>();
  const extras = [":timeline", ":quote"].flatMap((kind) =>
    [...document.querySelectorAll<HTMLElement>(`.extra[data-extra$="${kind}"]`)].flatMap((extra) => {
      const section = extra.closest(".section")!;
      if (kind === ":quote" && quoted.has(section)) return [];
      extra.hidden = false;
      if (section.scrollHeight > section.clientHeight) {
        extra.hidden = true;
        return [];
      }
      if (kind === ":quote") quoted.add(section);
      return [extra.dataset.extra!];
    }),
  );

  // A section's room: the height between its last item and its bottom, in pixels.
  const fillers = [...document.querySelectorAll<HTMLElement>(".fillers .filler")].map((filler) => {
    const roomiest = sections
      .map((section) => ({
        section,
        stories: section.querySelector("article") ? 1 : 0,
        room: section.getBoundingClientRect().bottom - section.lastElementChild!.getBoundingClientRect().bottom,
      }))
      .sort((a, b) => b.stories - a.stories || b.room - a.room);
    for (const { section } of roomiest) {
      section.append(filler);
      if (section.scrollHeight <= section.clientHeight) return section.dataset.spot!;
      filler.remove();
    }
    return null;
  });

  // The room left in each section of stories, in inches (96 pixels each), to see how well the stories fill the pages.
  // Puzzles and the weather are left out: their space is set by their design, not by the writing.
  const space = Object.fromEntries(
    sections.filter((section) => section.querySelector("article")).map((section) => {
      const room = section.getBoundingClientRect().bottom - section.lastElementChild!.getBoundingClientRect().bottom;
      return [section.dataset.spot!, Math.round(room / 96 * 100) / 100];
    }),
  );
  return { fit: { fontSizes, fillers, comicHeight, extras, space }, overflowing: [...overflowing] };
}
