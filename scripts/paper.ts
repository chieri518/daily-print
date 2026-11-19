// Generates today's paper from paper.json without the web app: `npm run paper`.
// Output goes to editions/YYYY-MM-DD.pdf (+ .json with the text, puzzles and cost).
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { useClaudeCode } from "../lib/edition/claude.ts";
import { assemble, research, write } from "../lib/edition/editor.ts";
import { drawPictures } from "../lib/extras/illustrate.ts";
import { step } from "../lib/edition/log.ts";
import { renderPdf } from "../lib/paper/render.ts";
import { Settings } from "../lib/settings.ts";
import { today } from "../lib/today.ts";
import { describeForecast, getForecast } from "../lib/extras/weather.ts";

const settings = Settings.parse(JSON.parse(readFileSync("paper.json", "utf8")));
const { date, day } = today();
const file = `editions/${day}`;

console.log(
  `Writing ${settings.name} for ${date} with ${
    useClaudeCode ? "Claude Code" : "the Claude API"
  }. This takes a few minutes...`,
);
const started = Date.now();
// Following stories needs the web app, so Your Desk, if the paper has it, says how to follow one.
const [forecast, notes] = await Promise.all([
  step("Getting the forecast", () => getForecast(settings.location, settings.temperature)),
  step("Researching the news", () => research(settings, date, [])),
]);
const { edition, usd } = await step("Writing the edition", () =>
  write(settings, date, notes.notes, forecast ? describeForecast(forecast) : "", [], []),
);
const images = await step("Drawing the pictures", () => drawPictures(settings, edition));
// Birthdays need a Google Calendar connected in the web app, so this command prints without them.
const paper = assemble(edition, forecast, day, []);
const costUsd = notes.usd + usd;
mkdirSync("editions", { recursive: true });
writeFileSync(`${file}.json`, JSON.stringify({ date, costUsd, paper }, null, 2));

// The most recent earlier edition, whose answers this paper prints.
const previous = readdirSync("editions")
  .filter((f) => f.endsWith(".json") && f < `${day}.json`)
  .sort()
  .at(-1);
const yesterday = previous ? JSON.parse(readFileSync(`editions/${previous}`, "utf8")).paper?.puzzles ?? null : null;

const { pdf, overflowing } = await step("Printing the PDF", () =>
  renderPdf(paper, { settings, date, yesterday, pictures: images, fit: null }),
);
writeFileSync(`${file}.pdf`, pdf);

if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
  console.warn("No pictures: add OPENAI_API_KEY or GEMINI_API_KEY to .env to draw the illustration and comic.");
}
if (overflowing.length) console.warn(`Warning: text is cut off on page ${overflowing.join(", ")}.`);
console.log(
  `Saved ${file}.pdf in ${Math.round((Date.now() - started) / 60000)} minutes. Cost: $${costUsd.toFixed(2)}${
    useClaudeCode ? " (estimate; your Claude subscription covers it)" : ""
  } plus the pictures`,
);
