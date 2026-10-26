import chromium from "@sparticuz/chromium";
import { chromium as playwright } from "playwright-core";

// Prints the paper's HTML to a PDF. Also returns the pages whose text still doesn't fit.
// On Vercel it uses a Chromium build made for serverless functions; locally, the one from `npx playwright-core install chromium`.
export async function renderPdf(html: string) {
  const browser = await playwright.launch(
    process.env.VERCEL ? { executablePath: await chromium.executablePath(), args: chromium.args } : {},
  );
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const overflowing = await page.evaluate(shrinkToFit);
    await page.evaluate(placeFillers);
    const pdf = await page.pdf({ preferCSSPageSize: true });
    return { pdf, overflowing };
  } finally {
    await browser.close();
  }
}

// Runs in the browser: shrinks the text on each page until every section fits, and returns the pages that still don't.
async function shrinkToFit() {
  await document.fonts.ready;
  const overflowing: number[] = [];
  document.querySelectorAll<HTMLElement>(".content").forEach((content, i) => {
    const sections = [...content.querySelectorAll<HTMLElement>(".section")];
    const tooTall = () => sections.some((s) => s.scrollHeight > s.clientHeight);
    for (let size = 9.75; tooTall() && size >= 7.5; size -= 0.25) content.style.fontSize = `${size}pt`;
    if (tooTall()) overflowing.push(i + 1);
  });
  return overflowing;
}

// Runs in the browser: puts each filler (quote, fun fact, on this day) at the bottom of the first section with room for
// it. Fillers that fit nowhere are left out. The comic shrinks to fit its spot, so it's fixed at its size first:
// otherwise a filler would squeeze it instead of overflowing.
function placeFillers() {
  for (const comic of document.querySelectorAll<HTMLElement>(".comic")) comic.style.flex = `0 0 ${comic.offsetHeight}px`;
  const sections = [...document.querySelectorAll<HTMLElement>(".page .section")];
  for (const filler of document.querySelectorAll<HTMLElement>(".fillers .filler")) {
    for (const section of sections) {
      section.append(filler);
      if (section.scrollHeight <= section.clientHeight) break;
      filler.remove();
    }
  }
}
