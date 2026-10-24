// Generates today's paper from paper.json without the web app: `npm run paper`.
// Output goes to editions/YYYY-MM-DD.pdf (+ .json with the text, puzzles and cost).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { useClaudeCode } from "../lib/claude.ts";
import { research, write, type Paper } from "../lib/editor.ts";
import { illustrate } from "../lib/illustrate.ts";
import { layout } from "../lib/layout.ts";
import { makePuzzles } from "../lib/puzzles.ts";
import { renderPdf } from "../lib/render.ts";
import { Settings } from "../lib/settings.ts";
import { today } from "../lib/today.ts";
import { describeForecast, getForecast } from "../lib/weather.ts";

const settings = Settings.parse(JSON.parse(readFileSync("paper.json", "utf8")));
const { date, day } = today();
const file = `editions/${day}`;

console.log(
  `Writing ${settings.name} for ${date} with ${
    useClaudeCode ? "Claude Code" : "the Claude API"
  }. This takes a few minutes...`,
);
const forecast = await getForecast(settings.location);
const notes = await research(settings, date);
const { edition, usd } = await write(settings, date, notes.notes, forecast ? describeForecast(forecast) : "");
const image = await illustrate(edition.illustration);
// Birthdays need a Google Calendar connected in the web app, so this command prints without them.
const paper: Paper = { ...edition, forecast, puzzles: makePuzzles(day, edition), birthdays: [] };
const costUsd = notes.usd + usd;
mkdirSync("editions", { recursive: true });
writeFileSync(`${file}.json`, JSON.stringify({ date, costUsd, paper }, null, 2));

// The most recent earlier edition, whose answers this paper prints.
const previous = readdirSync("editions")
  .filter((f) => f.endsWith(".json") && f < `${day}.json`)
  .sort()
  .at(-1);
const yesterday = previous ? JSON.parse(readFileSync(`editions/${previous}`, "utf8")).paper?.puzzles ?? null : null;

const { pdf, overflowing } = await renderPdf(layout(settings, date, paper, image, yesterday));
writeFileSync(`${file}.pdf`, pdf);

if (!image) console.warn("No illustration: add OPENAI_API_KEY or GEMINI_API_KEY to .env to draw one.");
if (overflowing.length) console.warn(`Warning: text is cut off on page ${overflowing.join(", ")}.`);
console.log(
  `Saved ${file}.pdf. Cost: $${costUsd.toFixed(2)}${
    useClaudeCode ? " (estimate; your Claude subscription covers it)" : ""
  } plus the illustration`,
);
