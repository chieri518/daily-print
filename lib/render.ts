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
    const pdf = await page.pdf({ preferCSSPageSize: true });
    return { pdf, overflowing };
  } finally {
    await browser.close();
  }
}

// Runs in the browser: shrinks the text on each page until every slot fits, and returns the pages that still don't.
async function shrinkToFit() {
  await document.fonts.ready;
  const overflowing: number[] = [];
  document.querySelectorAll<HTMLElement>(".content").forEach((content, i) => {
    const slots = [...content.querySelectorAll<HTMLElement>(".slot")];
    const tooTall = () => slots.some((slot) => slot.scrollHeight > slot.clientHeight);
    for (let size = 9.75; tooTall() && size >= 7.5; size -= 0.25) content.style.fontSize = `${size}pt`;
    if (tooTall()) overflowing.push(i + 1);
  });
  return overflowing;
}
