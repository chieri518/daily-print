import chromium from "@sparticuz/chromium";
import { chromium as playwright, type Page } from "playwright-core";
import { createElement } from "react";
import type { Paper } from "./editor.ts";
import { Newspaper, type Fit, type Layout } from "./paper.tsx";
import { css } from "./paper-css.ts";
import { fontsUrl, PAPER_SIZES, TYPEFACES } from "./settings.ts";

// Prints the paper to a PDF. First it draws the pages and measures how they fit: the text on each page shrinks until
// every section fits, and the fillers go where there's room. Then it prints the pages drawn with that fit, which is
// saved with the edition so the Paper page draws exactly the same pages. Also returns the pages whose text still
// doesn't fit.
// On Vercel it uses a Chromium build made for serverless functions; locally, the one from `npx playwright-core install chromium`.
export async function renderPdf(paper: Paper, layout: Layout) {
  const browser = await playwright.launch(
    process.env.VERCEL ? { executablePath: await chromium.executablePath(), args: chromium.args } : {},
  );
  try {
    const page = await browser.newPage();
    await show(page, paper, { ...layout, fit: null });
    const { fit, overflowing } = await page.evaluate(measureFit);
    await show(page, paper, { ...layout, fit });
    const pdf = await page.pdf({ preferCSSPageSize: true });
    return { pdf, fit, overflowing };
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

// Runs in the browser. Shrinks the text on each page until every section fits. Then puts each filler (quote, fun fact,
// on this day) at the bottom of the first section with room for it; fillers that fit nowhere are left out. The comic
// shrinks to fit its spot, so it's fixed at its size first: otherwise a filler would squeeze it instead of overflowing.
// No named functions inside: `npm run paper` runs through tsx, which wraps them in a helper the browser doesn't have.
async function measureFit(): Promise<{ fit: Fit; overflowing: number[] }> {
  await document.fonts.ready;
  const fontSizes: number[] = [];
  const overflowing: number[] = [];
  document.querySelectorAll<HTMLElement>(".content").forEach((content, i) => {
    const sections = [...content.querySelectorAll<HTMLElement>(".section")];
    let size = 10;
    while (size > 7.5 && sections.some((s) => s.scrollHeight > s.clientHeight)) {
      content.style.fontSize = `${(size -= 0.25)}pt`;
    }
    fontSizes.push(size);
    if (sections.some((s) => s.scrollHeight > s.clientHeight)) overflowing.push(i + 1);
  });

  const comic = document.querySelector<HTMLElement>(".comic");
  const comicHeight = comic?.offsetHeight ?? null;
  if (comic) comic.style.flex = `0 0 ${comicHeight}px`;

  const sections = [...document.querySelectorAll<HTMLElement>(".page .section")];
  const fillers = [...document.querySelectorAll<HTMLElement>(".fillers .filler")].map((filler) => {
    for (const section of sections) {
      section.append(filler);
      if (section.scrollHeight <= section.clientHeight) return section.dataset.spot!;
      filler.remove();
    }
    return null;
  });
  return { fit: { fontSizes, fillers, comicHeight }, overflowing };
}
