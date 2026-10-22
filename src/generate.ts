// Generates today's paper: `npm run paper`. Output goes to editions/YYYY-MM-DD.pdf (+ .json with the text and cost).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import { cost } from "./claude.ts";
import { writeEdition, type Settings } from "./editor.ts";
import { layout } from "./layout.ts";

const settings: Settings = JSON.parse(readFileSync("paper.json", "utf8"));
const today = new Date();
const date = today.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
const file = `editions/${today.toLocaleDateString("en-CA")}`; // en-CA formats as YYYY-MM-DD

console.log(`Writing ${settings.name} for ${date}. This takes a few minutes...`);
const edition = await writeEdition(settings, date);
mkdirSync("editions", { recursive: true });
writeFileSync(`${file}.json`, JSON.stringify({ date, costUsd: cost.usd, edition }, null, 2));

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(layout(settings, date, edition), { waitUntil: "networkidle" });
const overflowing = await page.evaluate(shrinkToFit);
await page.pdf({ path: `${file}.pdf`, preferCSSPageSize: true });
await browser.close();

if (overflowing.length) console.warn(`Warning: text is cut off on page ${overflowing.join(", ")}.`);
console.log(`Saved ${file}.pdf. Cost: $${cost.usd.toFixed(2)}`);

// Runs in the browser: shrinks the text on each page until it fits, and returns the pages that still don't.
async function shrinkToFit() {
  await document.fonts.ready;
  const overflowing: number[] = [];
  document.querySelectorAll<HTMLElement>(".content").forEach((content, i) => {
    const tooTall = () => content.scrollHeight > content.clientHeight;
    for (let size = 9.75; tooTall() && size >= 7.5; size -= 0.25) content.style.fontSize = `${size}pt`;
    if (tooTall()) overflowing.push(i + 1);
  });
  return overflowing;
}
