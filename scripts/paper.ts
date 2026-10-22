// Generates today's paper from paper.json without the web app: `npm run paper`.
// Output goes to editions/YYYY-MM-DD.pdf (+ .json with the text and cost).
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { research, Settings, write } from "../lib/editor.ts";
import { layout } from "../lib/layout.ts";
import { renderPdf } from "../lib/render.ts";
import { today } from "../lib/today.ts";

const settings = Settings.parse(JSON.parse(readFileSync("paper.json", "utf8")));
const { date, day } = today();
const file = `editions/${day}`;

console.log(`Writing ${settings.name} for ${date}. This takes a few minutes...`);
const notes = await research(settings, date);
const { edition, usd } = await write(settings, date, notes.notes);
const costUsd = notes.usd + usd;
mkdirSync("editions", { recursive: true });
writeFileSync(`${file}.json`, JSON.stringify({ date, costUsd, edition }, null, 2));

const { pdf, overflowing } = await renderPdf(layout(settings, date, edition));
writeFileSync(`${file}.pdf`, pdf);

if (overflowing.length) console.warn(`Warning: text is cut off on page ${overflowing.join(", ")}.`);
console.log(`Saved ${file}.pdf. Cost: $${costUsd.toFixed(2)}`);
